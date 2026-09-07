import React from 'react'
import { createRoot, type Root } from 'react-dom/client'

/**
 * Rendering for view tests.
 *
 * A view knows only its scope, so a test builds one by hand, renders, and reads
 * the DOM back. Nothing here boots a presenter or an application: what those do
 * is settled in `apps/cube-tutorial-test`, and repeating it would only make
 * these tests fail for reasons that have nothing to do with the view.
 *
 * Plain `react-dom/client` and `React.act`, the same way `wdc-cube-react` tests
 * itself — a rendering library would be one more thing between the assertion and
 * the markup.
 */
export class Rendered {
    private readonly root: Root

    public readonly container: HTMLDivElement

    public constructor() {
        this.container = document.createElement('div')
        document.body.appendChild(this.container)
        this.root = createRoot(this.container)
    }

    public render(element: React.ReactNode): this {
        React.act(() => this.root.render(element))
        return this
    }

    public unmount(): void {
        React.act(() => this.root.unmount())
        this.container.remove()
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
    public text(selector = '*'): string {
        const node = selector === '*' ? this.container : this.get(selector)
        return (node.textContent ?? '').replace(/\s+/g, ' ').trim()
    }

    /**
     * Applies a change to a scope and lets React finish redrawing.
     *
     * `scope.forceUpdate()` on its own only schedules the redraw; without act()
     * the assertion that follows reads the previous markup.
     */
    public act(change: () => void): this {
        React.act(change)
        return this
    }

    /** Dispatches an event the way React listens for it, inside act(). */
    public fire(selector: string, type: string, init?: EventInit): void {
        const target = this.get(selector)
        React.act(() => {
            target.dispatchEvent(new Event(type, { bubbles: true, ...init }))
        })
    }

    public click(selector: string): void {
        const target = this.get(selector)
        React.act(() => {
            target.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        })
    }

    public doubleClick(selector: string): void {
        const target = this.get(selector)
        React.act(() => {
            target.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
        })
    }

    /**
     * Leaves a field. React's onBlur listens for `focusout`, the bubbling twin of
     * `blur` — dispatching `blur` itself reaches nothing.
     */
    public blur(selector: string): void {
        const target = this.get(selector)
        React.act(() => {
            target.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
        })
    }

    public keyDown(selector: string, code: string): void {
        const target = this.get(selector)
        React.act(() => {
            target.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }))
        })
    }

    /**
     * Types into a field.
     *
     * The value goes in through the prototype's own setter rather than `field.value`.
     * React replaces that setter on every input it renders, to track what it last
     * saw; assigning through the replacement updates the tracker too, React then
     * concludes nothing changed, and `onChange` never fires. Going around it
     * leaves the tracker holding the old value, which is what a real keystroke
     * looks like.
     */
    public type(selector: string, value: string): void {
        const field = this.get<HTMLInputElement>(selector)
        const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
        setValue?.call(field, value)
        React.act(() => {
            field.dispatchEvent(new Event('input', { bubbles: true }))
        })
    }
}
