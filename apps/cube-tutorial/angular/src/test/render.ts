import { type Type } from '@angular/core'
import { TestBed, type ComponentFixture } from '@angular/core/testing'

/**
 * Rendering for view tests.
 *
 * A view knows only its scope, so a test builds one by hand, renders, and reads
 * the DOM back. Nothing here boots a presenter or an application: what those do
 * is settled in `apps/cube-tutorial/test`, and repeating it would only make
 * these tests fail for reasons that have nothing to do with the view.
 */
export class Rendered<C> {
    public readonly fixture: ComponentFixture<C>

    public constructor(view: Type<C>, inputs: Record<string, unknown>) {
        TestBed.configureTestingModule({ imports: [view] })
        this.fixture = TestBed.createComponent(view)

        for (const [name, value] of Object.entries(inputs)) {
            this.fixture.componentRef.setInput(name, value)
        }

        this.fixture.detectChanges()
    }

    public get element(): HTMLElement {
        return this.fixture.nativeElement as HTMLElement
    }

    public destroy(): void {
        this.fixture.destroy()
        // TestBed refuses to be configured again once instantiated, so a test
        // that renders a second time — the same view under a different scope —
        // has to start it over.
        TestBed.resetTestingModule()
    }

    /**
     * Applies a change and lets Angular finish redrawing.
     *
     * The application is zoneless, so nothing runs change detection on its own —
     * which is the point of the binding, and means a test has to ask.
     */
    public act(change?: () => void): this {
        change?.()
        this.fixture.detectChanges()
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

    public dispatch(target: Element, event: Event): this {
        target.dispatchEvent(event)
        return this.act()
    }

    public click(selector: string): this {
        return this.dispatch(this.get(selector), new MouseEvent('click', { bubbles: true }))
    }

    public doubleClick(selector: string): this {
        return this.dispatch(this.get(selector), new MouseEvent('dblclick', { bubbles: true }))
    }

    public blur(selector: string): this {
        return this.dispatch(this.get(selector), new FocusEvent('blur'))
    }

    public keyDown(selector: string, code: string): this {
        return this.dispatch(this.get(selector), new KeyboardEvent('keydown', { code, bubbles: true }))
    }

    /**
     * Types into a field. Angular listens for the native `input` event and reads
     * the element, so unlike React there is no value tracker to work around.
     */
    public type(selector: string, value: string): this {
        const field = this.get<HTMLInputElement>(selector)
        field.value = value
        return this.dispatch(field, new Event('input', { bubbles: true }))
    }
}

/** Renders `view` with `scope` as its only input, which is every Cube view. */
export function renderView<C>(view: Type<C>, scope: unknown): Rendered<C> {
    return new Rendered(view, { scope })
}
