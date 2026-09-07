/**
 * Copyright © 2025 WeDoCode Consultoria e Soluções Avançadas LTDA. All rights reserved.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import { Logger, NOOP_VOID, type Scope } from 'wdc-cube'

import { Dom } from './Dom'

const LOG = Logger.get('WC.CubeElement')

/** Told when an action fails, so an application can show it however it likes. */
export type ActionErrorHandler = (context: string, error: unknown) => void

let reportActionError: ActionErrorHandler = (context, error) => {
    LOG.error(`Action "${context}" failed`, error)
}

/** Replaces what happens when an action throws. */
export function onActionError(handler: ActionErrorHandler): void {
    reportActionError = handler
}

/**
 * A Cube view, which is also a custom element.
 *
 * Nothing is underneath this — no framework, no diff, no template compiler. The
 * two obligations of the view boundary are met by the platform: `customElements`
 * is the registry, `document.createElement` is how a slot builds a child, and a
 * property setter is how it is handed its scope.
 *
 * A view has the same two halves as any other in this workspace:
 *
 * ```ts
 * class FooterView extends CubeElement<FooterScope> {
 *     private count!: HTMLElement
 *
 *     protected declare(dom: Dom) {
 *         this.count = dom.span()
 *     }
 *
 *     protected override onUpdate() {
 *         this.setText(this.count, `${this.scope.count} left`)
 *     }
 * }
 * ```
 *
 * `declare` runs once and says what exists; `onUpdate` runs on every redraw and
 * says what it should show, comparing before it writes. React would diff and
 * Angular would check bindings; here the view does it, which is the point.
 */
export abstract class CubeElement<S extends Scope = Scope> extends HTMLElement {
    // A field here shares a namespace with every property HTMLElement already
    // has — `title`, `id`, `hidden`, `lang`, `style`. TypeScript catches the
    // collision, but the message points at the registration rather than the
    // field, so it is worth knowing: name captured elements `titleLabel`, not
    // `title`.
    private declared = false

    private boundScope?: S

    private currentScope?: S

    /** The scope this view draws. Setting it binds `forceUpdate` and redraws. */
    public get scope(): S {
        if (!this.currentScope) {
            throw new Error(`${this.constructor.name} was used before it was given a scope`)
        }
        return this.currentScope
    }

    public set scope(scope: S) {
        if (scope === this.currentScope) {
            return
        }

        this.releaseScope()
        this.currentScope = scope

        if (scope) {
            scope.forceUpdate = this.update
            this.boundScope = scope
        }

        if (this.isConnected) {
            this.ensureDeclared()
            this.update()
        }
    }

    /** Declares the element's children. Runs once, before the first update. */
    protected abstract declare(dom: Dom): void

    /** Pushes the scope's state into those children. Runs on every redraw. */
    protected onUpdate(): void {
        // A view with nothing to push does not override this.
    }

    /** Undoes anything `declare` set up outside the tree. */
    protected onRelease(): void {
        // Most views have nothing to undo.
    }

    public connectedCallback(): void {
        if (this.currentScope) {
            this.ensureDeclared()
            this.update()
        }
    }

    public disconnectedCallback(): void {
        this.release()
    }

    /** Hands the scope its `forceUpdate` back and lets the view clean up. */
    public release(): void {
        this.releaseScope()
        this.onRelease()
    }

    /** Redraws now. Reads the scope, writes what differs. */
    public readonly update = (): void => {
        if (!this.declared || !this.currentScope) {
            return
        }
        try {
            this.onUpdate()
        } catch (caught) {
            LOG.error(`Updating ${this.constructor.name}`, caught)
        }
    }

    private ensureDeclared(): void {
        if (this.declared) {
            return
        }
        this.declared = true
        Dom.render(this, (dom) => {
            this.declare(dom)
        })
    }

    private releaseScope(): void {
        if (this.boundScope && this.boundScope.forceUpdate === this.update) {
            this.boundScope.forceUpdate = NOOP_VOID
        }
        this.boundScope = undefined
    }

    // ========== CONVENIENCES ==========

    /**
     * Runs a handler, reporting rather than throwing.
     *
     * Every listener goes through this. A handler that throws inside a DOM event
     * becomes an unhandled error on window, which is a poor way to learn about a
     * bug; the context name is what makes the report legible.
     */
    protected safeAction(context: string, action: () => unknown): void {
        try {
            const result = action()
            if (result instanceof Promise) {
                result.catch((caught: unknown) => reportActionError(context, caught))
            }
        } catch (caught) {
            reportActionError(context, caught)
        }
    }

    /** Sets text, but only when it differs. */
    protected setText(node: Node, text: string): void {
        if (node.textContent !== text) {
            node.textContent = text
        }
    }

    /** Adds or removes a class, only when that is not already so. */
    protected setClass(element: Element, name: string, present: boolean): void {
        if (element.classList.contains(name) !== present) {
            element.classList.toggle(name, present)
        }
    }

    /** Shows or hides, only when that is not already so. */
    protected setVisible(element: HTMLElement, visible: boolean): void {
        if (element.hidden === visible) {
            element.hidden = !visible
        }
    }

    /**
     * Sets a field's value, but only when it differs.
     *
     * The comparison is not an optimisation: writing a field on every redraw
     * moves the caret to the end while somebody is typing in it. Unlike a widget
     * toolkit, assigning `.value` fires no event, so nothing else is needed.
     */
    protected setValue(field: HTMLInputElement, value: string): void {
        if (field.value !== value) {
            field.value = value
        }
    }
}
