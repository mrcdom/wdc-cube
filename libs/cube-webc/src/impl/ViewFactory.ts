/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import { createViewRegistry, Logger, type Scope, type ScopeConstructor } from 'wdc-cube'

import type { CubeElement } from './CubeElement'

const LOG = Logger.get('WebC.ViewFactory')

/** A view class, which is also a custom element class. */
export type ViewConstructor<S extends Scope = Scope> = CustomElementConstructor & { new (): CubeElement<S> }

/** What the registry stores: the tag the browser knows this view by. */
const registry = createViewRegistry<string>('wdc-cube-webc:view')

export const ViewFactory = {
    /**
     * Defines a custom element and pairs it with the scope it draws.
     *
     * Two registries are involved and only one of them is ours: the browser's
     * `customElements` already maps a tag to a class, so this adds the half it
     * cannot know — which scope that tag is for.
     */
    define<S extends Scope>(tag: string, scopeCtor: ScopeConstructor, viewCtor: ViewConstructor<S>): void {
        if (!customElements.get(tag)) {
            customElements.define(tag, viewCtor)
        }
        registry.register(scopeCtor, tag)
    },

    /** The tag registered for this scope's class, if any. */
    tagFor(scope?: Scope): string | undefined {
        return registry.get(scope)
    },

    /** Builds the element for a scope, already holding it. */
    create(scope: Scope): CubeElement | undefined {
        const tag = ViewFactory.tagFor(scope)
        if (!tag) {
            LOG.error(`No view registered for scope ${scope.constructor.name}`)
            return undefined
        }

        const element = document.createElement(tag) as CubeElement
        element.scope = scope
        return element
    }
}

/**
 * Holds whichever view matches the scope currently in a slot.
 *
 * The other obligation of the view boundary, and on this platform it is three
 * lines: look up the tag, create the element, put it in. Handing the element its
 * scope is a property assignment, which is also what makes it redraw.
 */
export class CubeViewSlot {
    private current?: CubeElement

    private currentScope?: Scope | null

    public constructor(private readonly host: Element) {}

    /** The view on screen, if any. */
    public get view(): CubeElement | undefined {
        return this.current
    }

    /**
     * Draws `scope`, replacing whatever was there. A nullish scope empties the
     * slot. Handing it the same scope twice does nothing.
     */
    public setScope(scope?: Scope | null): void {
        if (scope === this.currentScope) {
            return
        }
        this.currentScope = scope

        if (this.current) {
            // Removing it fires disconnectedCallback, which releases the scope.
            this.current.remove()
            this.current = undefined
        }

        if (!scope) {
            return
        }

        const element = ViewFactory.create(scope)
        if (!element) {
            return
        }

        this.host.appendChild(element)
        this.current = element
    }
}
