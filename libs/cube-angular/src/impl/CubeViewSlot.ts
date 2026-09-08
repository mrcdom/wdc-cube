/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import { Directive, ViewContainerRef, effect, inject, input, type ComponentRef } from '@angular/core'
import { Logger, type Scope } from 'wdc-cube'

import { ViewFactory } from './ViewFactory'

const LOG = Logger.get('Angular.CubeViewSlot')

/**
 * Renders whichever component is registered for the scope currently sitting in a
 * slot. This is how a presenter places a child without naming the component that
 * will draw it — the other half of the view boundary, alongside `bindScope`.
 *
 * ```html
 * <ng-container *cubeViewSlot="scope.page()"></ng-container>
 * ```
 *
 * A structural directive rather than a wrapper component, so the slot itself
 * adds nothing to the DOM.
 *
 * The component it creates still gets a host element — Angular always gives one,
 * and React's binding has no equivalent. Left alone that element sits between
 * the slot's parent and the view's own markup, which breaks any layout the two
 * were meant to share: a flex child stops being a flex child, and a scroll
 * container stops being constrained by its parent. So the host is set to
 * `display: contents`, making it transparent to layout and putting the view's
 * markup where React would have put it. A view that wants a real box of its own
 * can take it back with `:host { display: block !important }`.
 */
@Directive({
    selector: '[cubeViewSlot]'
})
export class CubeViewSlot {
    /** The scope to draw. A nullish value renders nothing. */
    readonly cubeViewSlot = input.required<Scope | undefined | null>()

    private readonly container = inject(ViewContainerRef)

    private rendered?: ComponentRef<unknown>
    private renderedFor?: Scope | null

    constructor() {
        effect(() => {
            const scope = this.cubeViewSlot()

            if (scope === this.renderedFor) {
                return
            }

            this.container.clear()
            this.rendered = undefined
            this.renderedFor = scope

            if (!scope) {
                return
            }

            const view = ViewFactory.get(scope)
            if (!view) {
                LOG.error(`No view registered for scope ${scope.constructor.name}`)
                return
            }

            this.rendered = this.container.createComponent(view)

            // See the note on this class: the host element must not take part in
            // layout, or the view's markup is separated from its parent's.
            const host = this.rendered.location.nativeElement as HTMLElement
            host.style.display = 'contents'

            // setInput rather than writing the property: it marks the created
            // view dirty, which a zoneless application needs in order to draw it.
            this.rendered.setInput('scope', scope)
        })
    }
}
