/**
 * Copyright © 2025 WeDoCode Consultoria e Soluções Avançadas LTDA. All rights reserved.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import { Logger, NOOP_VOID, type Scope } from 'wdc-cube'

import { Dom } from './Dom'

const LOG = Logger.get('WebC.CubeElement')

/**
 * What `setAttrByToken` last wrote, per element and attribute. Weak on the
 * element, so a row that goes away takes its entry with it.
 */
const attributeTokens = new WeakMap<Element, Map<string, unknown>>()

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
 * Runs a handler, reporting rather than throwing.
 *
 * Every listener goes through this. A handler that throws inside a DOM event
 * becomes an unhandled error on window, which is a poor way to learn about a
 * bug; the context name is what makes the report legible.
 *
 * A function rather than only a method, so a widget that is not a view — a
 * button built by a helper — can wire a listener the same way.
 */
export function safeAction(context: string, action: () => unknown): void {
    try {
        const result = action()
        if (result instanceof Promise) {
            result.catch((caught: unknown) => reportActionError(context, caught))
        }
    } catch (caught) {
        reportActionError(context, caught)
    }
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
export abstract class CubeElement<S extends Scope = Scope, D extends Dom = Dom> extends HTMLElement {
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
    protected abstract declare(dom: D): void

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

    /**
     * The `Dom` this view declares into. Override to hand every view an
     * application's own — one with factory methods for its widgets.
     */
    protected createDom(root: Element): D {
        // Correct whenever D is left at its default; a view that narrows it
        // overrides this, which is the only way to narrow it in the first place.
        return Dom.create(root) as D
    }

    private ensureDeclared(): void {
        if (this.declared) {
            return
        }
        this.declared = true
        this.declare(this.createDom(this))
    }

    private releaseScope(): void {
        if (this.boundScope && this.boundScope.forceUpdate === this.update) {
            this.boundScope.forceUpdate = NOOP_VOID
        }
        this.boundScope = undefined
    }

    // ========== CONVENIENCES ==========

    /**
     * A listener that runs a scope action through the guard.
     *
     * Declared once as a field and referenced wherever it is wired:
     *
     * ```ts
     * private readonly onToggle = this.action('onToggle', () => this.scope.actions.onToggle())
     * // ...
     * input.addEventListener('change', this.onToggle)
     * ```
     *
     * The point is not brevity. A handler written inline at the listener is a
     * new function on every declaration and says what it does in the middle of
     * saying where it goes; declared as a field, a view's actions are a list you
     * can read at the top of the class, each with the name it reports under. And
     * because this is the only ergonomic way to build one, the guard stops being
     * something to remember.
     *
     * For an action that needs something the declaration knows — the row it was
     * put on, say — the field becomes a factory that takes it and hands back the
     * listener.
     */
    protected action<E extends Event = Event>(context: string, run: (event: E) => unknown): (event: E) => void {
        return (event) => safeAction(context, () => run(event))
    }

    /** See the module-level {@link safeAction}; every listener goes through it. */
    protected safeAction(context: string, action: () => unknown): void {
        safeAction(context, action)
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

    /**
     * Sets an attribute, but only when it differs.
     *
     * Named `setAttr` rather than `setAttribute` on purpose: a view *is* an
     * Element, so the obvious name would override the DOM's own method.
     *
     * The guard earns its keep on attributes the browser acts upon. Rewriting an
     * SVG path's `d` invalidates its geometry, so an identical value still costs
     * a re-parse; `class` and `style` the browser dedupes for you, but the point
     * is that a view should not have to know which is which.
     */
    protected setAttr(element: Element, name: string, value: string): void {
        if (element.getAttribute(name) !== value) {
            element.setAttribute(name, value)
        }
    }

    /**
     * Sets an attribute, deciding from a cheap token rather than the value.
     *
     * `setAttr` asks the element what it currently holds, and `getAttribute`
     * serialises the whole value to answer — so its cost grows with the value
     * while the token's does not. Measured over 200k unchanged writes: a 66
     * character path costs 15.7ms by value against 2.7ms by token, and a 1320
     * character one 103.5ms against 1.6ms.
     *
     * Use it where the value is long or built on the fly and something small
     * already says whether it changed — an SVG path chosen by a name, say. For
     * a short literal, `setAttr` is simpler and the difference is nothing.
     */
    protected setAttrByToken(element: Element, name: string, token: unknown, value: string): void {
        let tokens = attributeTokens.get(element)
        if (!tokens) {
            tokens = new Map()
            attributeTokens.set(element, tokens)
        }

        // `has` as well as `get`, so a token of undefined still counts as set.
        if (tokens.has(name) && tokens.get(name) === token) {
            return
        }

        tokens.set(name, token)
        element.setAttribute(name, value)
    }

    /** Checks or unchecks a box, only when that is not already so. */
    protected setChecked(field: HTMLInputElement, checked: boolean): void {
        if (field.checked !== checked) {
            field.checked = checked
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
