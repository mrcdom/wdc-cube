import { afterEach, describe, expect, it, vi } from 'vitest'
import { ItemScope } from 'wdc-cube-tutorial-presentation/todo-mvc'

import { Rendered } from '../../../test/render'
import { ItemView } from './v-item'

let ui: Rendered | undefined

afterEach(() => {
    ui?.unmount()
    ui = undefined
})

/**
 * A scope built by hand. Actions are plain function properties, so a spy goes
 * straight in — no presenter, and no mocking framework beyond `vi.fn`.
 */
function anItem(overrides: Partial<Pick<ItemScope, 'id' | 'title' | 'completed' | 'editing'>> = {}) {
    const scope = new ItemScope()
    scope.id = overrides.id ?? 1
    scope.title = overrides.title ?? 'Walk the dog'
    scope.completed = overrides.completed ?? false
    scope.editing = overrides.editing ?? false

    scope.actions.onToggle = vi.fn()
    scope.actions.onEdit = vi.fn()
    scope.actions.onDestroy = vi.fn()
    scope.actions.onBlur = vi.fn()
    scope.actions.onKeyDown = vi.fn()

    return scope
}

describe('ItemView', () => {
    describe('drawing the scope', () => {
        it('shows the title, unchecked and unmarked while active', () => {
            ui = new Rendered().render(() => <ItemView scope={anItem({ title: 'Write the tests' })} />)

            expect(ui.text('label')).toEqual('Write the tests')
            expect(ui.get<HTMLInputElement>('input.toggle').checked).toBe(false)
            expect(ui.get('li').classList).not.toContain('completed')
        })

        it('marks the row completed and checks the box', () => {
            ui = new Rendered().render(() => <ItemView scope={anItem({ completed: true })} />)

            expect(ui.get<HTMLInputElement>('input.toggle').checked).toBe(true)
            expect(ui.get('li').classList).toContain('completed')
        })

        it('swaps the row for an edit field carrying the current title', () => {
            ui = new Rendered().render(() => <ItemView scope={anItem({ editing: true, title: 'Half typed' })} />)

            expect(ui.get<HTMLInputElement>('input.edit').value).toEqual('Half typed')
            expect(ui.has('label')).toBe(false)
        })

        it('redraws when the scope says so', () => {
            const scope = anItem()
            ui = new Rendered().render(() => <ItemView scope={scope} />)

            ui.act(() => {
                scope.title = 'Another title'
                scope.forceUpdate()
            })

            expect(ui.text('label')).toEqual('Another title')
        })

        it('wakes only the expression that reads the field that moved', () => {
            const scope = anItem()
            ui = new Rendered().render(() => <ItemView scope={scope} />)

            const label = ui.get('label')
            const toggle = ui.get('input.toggle')

            ui.act(() => (scope.title = 'Another title'))

            // Neither node was rebuilt: the title's text moved and nothing else.
            expect(ui.get('label')).toBe(label)
            expect(ui.get('input.toggle')).toBe(toggle)
        })
    })

    describe('firing actions', () => {
        it('toggles on the checkbox', () => {
            const scope = anItem()
            ui = new Rendered().render(() => <ItemView scope={scope} />)

            ui.click('input.toggle')

            expect(scope.actions.onToggle).toHaveBeenCalledOnce()
        })

        it('edits on a double click, and not on a single one', () => {
            const scope = anItem()
            ui = new Rendered().render(() => <ItemView scope={scope} />)

            ui.click('label')
            expect(scope.actions.onEdit).not.toHaveBeenCalled()

            ui.doubleClick('label')
            expect(scope.actions.onEdit).toHaveBeenCalledOnce()
        })

        it('destroys on the button', () => {
            const scope = anItem()
            ui = new Rendered().render(() => <ItemView scope={scope} />)

            ui.click('button.destroy')

            expect(scope.actions.onDestroy).toHaveBeenCalledOnce()
        })

        it('hands a getter for the edit field to onKeyDown, read when asked', () => {
            const scope = anItem({ editing: true })
            ui = new Rendered().render(() => <ItemView scope={scope} />)

            ui.get<HTMLInputElement>('input.edit').value = 'Edited after the event'
            ui.keyDown('input.edit', 'Enter')

            const [getValue, event] = vi.mocked(scope.actions.onKeyDown).mock.calls[0]
            expect(getValue()).toEqual('Edited after the event')
            expect(event.code).toEqual('Enter')
        })

        it('hands the same getter to onBlur', () => {
            const scope = anItem({ editing: true })
            ui = new Rendered().render(() => <ItemView scope={scope} />)

            ui.get<HTMLInputElement>('input.edit').value = 'Edited after the event'
            ui.blur('input.edit')

            expect(vi.mocked(scope.actions.onBlur).mock.calls[0][0]()).toEqual('Edited after the event')
        })
    })

    /**
     * The caret placement is the reason the edit field is a component with an
     * `onMount` rather than a `ref`: Solid calls a ref while the element is being
     * built, before it is in the document, and focusing an element that is not in
     * the document does nothing.
     */
    it('focuses the edit field with the caret at the end', () => {
        const scope = anItem({ editing: true, title: 'Walk the dog' })
        ui = new Rendered().render(() => <ItemView scope={scope} />)

        const field = ui.get<HTMLInputElement>('input.edit')
        expect(document.activeElement).toBe(field)
        expect(field.selectionStart).toEqual('Walk the dog'.length)
    })
})
