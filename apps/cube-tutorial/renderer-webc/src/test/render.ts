import type { Scope } from 'wdc-cube'
import type { CubeElement } from 'wdc-cube-webc'

/**
 * Rendering for view tests.
 *
 * A view knows only its scope, so a test builds one by hand, renders, and reads
 * the DOM back. Nothing here boots a presenter or an application: what those do
 * is settled in `apps/cube-tutorial/presentation-test`, and repeating it would
 * only make these tests fail for reasons that have nothing to do with the view.
 *
 * There is no rendering library to leave out here — a view *is* an element, so
 * the harness creates it, gives it a scope, and reads the document.
 */
export class Rendered<S extends Scope = Scope> {
    public readonly container: HTMLDivElement

    public readonly element: CubeElement<S>

    /**
     * `tag` rather than the class: a view is registered with the browser under a
     * name, and a test that asks for it the way the slot does is a test that
     * proves the registration too.
     */
    public constructor(tag: string, scope: S) {
        this.container = document.createElement('div')
        document.body.appendChild(this.container)

        this.element = document.createElement(tag) as CubeElement<S>
        this.container.appendChild(this.element)

        // Assigning the scope is what declares the tree and draws it the first
        // time. It is also the whole of the binding's contract.
        this.element.scope = scope
    }

    public unmount(): void {
        this.element.remove()
        this.container.remove()
    }

    /**
     * Applies a change to a scope.
     *
     * `scope.forceUpdate()` redraws synchronously, so there is nothing to wait
     * for. The batching a running application has comes from the presenter's
     * update manager, and there is no presenter here — which is the point.
     */
    public act(change: () => void): this {
        change()
        return this
    }

    /** The first element matching, failing with the selector rather than a null dereference. */
    public get<E extends Element = HTMLElement>(selector: string): E {
        const found = this.element.querySelector<E>(selector)
        if (!found) {
            throw new Error(`Nothing matches "${selector}" in:\n${this.element.innerHTML}`)
        }
        return found
    }

    public all<E extends Element = HTMLElement>(selector: string): E[] {
        return [...this.element.querySelectorAll<E>(selector)]
    }

    public has(selector: string): boolean {
        return this.element.querySelector(selector) !== null
    }

    /** Text content of the first match, whitespace collapsed. */
    public text(selector?: string): string {
        const node = selector ? this.get(selector) : this.element
        return (node.textContent ?? '').replace(/\s+/g, ' ').trim()
    }

    /** Whether an element is shown, which these views say with `hidden`. */
    public visible(selector: string): boolean {
        return !this.get(selector).hidden
    }

    public dispatch(selector: string, event: Event): this {
        this.get(selector).dispatchEvent(event)
        return this
    }

    public click(selector: string): this {
        return this.dispatch(selector, new MouseEvent('click', { bubbles: true }))
    }

    public doubleClick(selector: string): this {
        return this.dispatch(selector, new MouseEvent('dblclick', { bubbles: true }))
    }

    /** Leaves a field. The listener is on the element itself, so `blur` reaches it. */
    public blur(selector: string): this {
        return this.dispatch(selector, new FocusEvent('blur'))
    }

    public keyDown(selector: string, code: string): this {
        return this.dispatch(selector, new KeyboardEvent('keydown', { code, bubbles: true }))
    }

    /**
     * Types into a field. The views listen for the native `input` event and read
     * the element, so unlike React there is no value tracker to work around.
     */
    public type(selector: string, value: string): this {
        this.get<HTMLInputElement>(selector).value = value
        return this.dispatch(selector, new Event('input', { bubbles: true }))
    }
}

/** Renders the view registered under `tag`, drawing `scope`. */
export function renderView<S extends Scope>(tag: string, scope: S): Rendered<S> {
    return new Rendered(tag, scope)
}
