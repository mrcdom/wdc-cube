/**
 * Copyright © 2025 WeDoCode Consultoria e Soluções Avançadas LTDA. All rights reserved.
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
 * A structural directive rather than a wrapper component, so the rendered view
 * is the slot's only output and no host element is inserted around it.
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
            // setInput rather than writing the property: it marks the created
            // view dirty, which a zoneless application needs in order to draw it.
            this.rendered.setInput('scope', scope)
        })
    }
}
