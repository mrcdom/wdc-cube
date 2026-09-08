import { Dialog } from '@kobalte/core/dialog'
import { type JSX } from 'solid-js'
import { render } from 'solid-js/web'

/**
 * Rendering for view tests.
 *
 * A view knows only its scope, so a test builds one by hand, renders, and reads
 * the DOM back. Nothing here boots a presenter or an application: what those do
 * is settled in `apps/cube-tutorial/presentation-test`, and repeating it would
 * only make these tests fail for reasons that have nothing to do with the view.
 *
 * Plain `solid-js/web`, the same way `wdc-cube-solid` tests itself — a rendering
 * library would be one more thing between the assertion and the markup.
 */
export class Rendered {
    public readonly container: HTMLDivElement

    private dispose?: () => void

    public constructor() {
        this.container = document.createElement('div')
        // Attached to the document because Solid delegates click, input and
        // keydown there: an element in a detached tree never hears them.
        document.body.appendChild(this.container)
    }

    public render(view: () => JSX.Element): this {
        this.dispose = render(view, this.container)
        return this
    }

    /**
     * Renders a view that belongs inside a dialog.
     *
     * The alert reaches for `Dialog.Title` and `Dialog.Description`, which is how
     * the dialog around it learns what to point `aria-labelledby` at. Kobalte
     * refuses those outside a dialog, and it is right to: on its own the view is
     * not a thing that can be shown.
     */
    public renderInDialog(view: () => JSX.Element): this {
        return this.render(() => (
            <Dialog open modal={false}>
                <Dialog.Portal mount={this.container}>
                    <Dialog.Content>{view()}</Dialog.Content>
                </Dialog.Portal>
            </Dialog>
        ))
    }

    public unmount(): void {
        this.dispose?.()
        this.dispose = undefined
        this.container.remove()
    }

    /**
     * Applies a change to a scope.
     *
     * Unlike React and Angular, there is nothing to wait for: a field write goes
     * through the accessor the instrumentation installed, the signal moves, and
     * the expression reading it runs before this returns. The method exists so a
     * test reads the same in all four renderers.
     */
    public act(change: () => void): this {
        change()
        return this
    }

    /** The first element matching, failing with the selector rather than a null dereference. */
    public get<E extends Element = HTMLElement>(selector: string): E {
        const found = this.container.querySelector<E>(selector)
        if (!found) {
            throw new Error(`Nothing matches "${selector}" in:\n${this.container.innerHTML}`)
        }
        return found
    }

    public all<E extends Element = HTMLElement>(selector: string): E[] {
        return [...this.container.querySelectorAll<E>(selector)]
    }

    public has(selector: string): boolean {
        return this.container.querySelector(selector) !== null
    }

    /** Text content of the first match, whitespace collapsed. */
    public text(selector?: string): string {
        const node = selector ? this.get(selector) : this.container
        return (node.textContent ?? '').replace(/\s+/g, ' ').trim()
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

    /** Leaves a field. Solid does not delegate blur, so the element hears it directly. */
    public blur(selector: string): this {
        return this.dispatch(selector, new FocusEvent('blur'))
    }

    public keyDown(selector: string, code: string): this {
        return this.dispatch(selector, new KeyboardEvent('keydown', { code, bubbles: true }))
    }

    /**
     * Types into a field. Solid listens for the native `input` event and reads
     * the element, so unlike React there is no value tracker to work around.
     */
    public type(selector: string, value: string): this {
        this.get<HTMLInputElement>(selector).value = value
        return this.dispatch(selector, new Event('input', { bubbles: true }))
    }
}
