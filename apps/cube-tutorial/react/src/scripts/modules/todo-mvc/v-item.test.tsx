import { afterEach, describe, expect, it, vi } from 'vitest'
import { ItemScope } from 'wdc-cube-tutorial-app/todo-mvc'

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
            const scope = anItem({ title: 'Write the tests' })
            ui = new Rendered().render(<ItemView scope={scope} />)

            expect(ui.text('label')).toEqual('Write the tests')
            expect(ui.get<HTMLInputElement>('input.toggle').checked).toEqual(false)
            expect(ui.has('li.completed')).toEqual(false)
        })

        it('marks the row completed and checks the box', () => {
            ui = new Rendered().render(<ItemView scope={anItem({ completed: true })} />)

            expect(ui.has('li.completed')).toEqual(true)
            expect(ui.get<HTMLInputElement>('input.toggle').checked).toEqual(true)
        })

        it('swaps the row for an edit field carrying the current title', () => {
            ui = new Rendered().render(<ItemView scope={anItem({ editing: true, title: 'Go to school' })} />)

            expect(ui.has('li.editing')).toEqual(true)
            expect(ui.get<HTMLInputElement>('input.edit').value).toEqual('Go to school')
            // The view half is gone while editing.
            expect(ui.has('input.toggle')).toEqual(false)
            expect(ui.has('label')).toEqual(false)
        })

        it('redraws when the scope says so', () => {
            const scope = anItem({ title: 'Before' })
            ui = new Rendered().render(<ItemView scope={scope} />)

            ui.act(() => {
                scope.title = 'After'
                scope.completed = true
                scope.forceUpdate()
            })

            expect(ui.text('label')).toEqual('After')
            expect(ui.has('li.completed')).toEqual(true)
        })
    })

    describe('firing actions', () => {
        it('toggles on the checkbox', () => {
            const scope = anItem()
            ui = new Rendered().render(<ItemView scope={scope} />)

            ui.click('input.toggle')

            expect(scope.actions.onToggle).toHaveBeenCalledOnce()
        })

        it('edits on a double click, and not on a single one', () => {
            const scope = anItem()
            ui = new Rendered().render(<ItemView scope={scope} />)

            ui.click('label')
            expect(scope.actions.onEdit).not.toHaveBeenCalled()

            ui.doubleClick('label')
            expect(scope.actions.onEdit).toHaveBeenCalledOnce()
        })

        it('destroys on the button', () => {
            const scope = anItem()
            ui = new Rendered().render(<ItemView scope={scope} />)

            ui.click('button.destroy')

            expect(scope.actions.onDestroy).toHaveBeenCalledOnce()
        })

        it('hands a getter for the edit field to onKeyDown, read when asked', () => {
            const scope = anItem({ editing: true, title: 'Go to school' })
            ui = new Rendered().render(<ItemView scope={scope} />)

            ui.type('input.edit', 'Go to school early')
            ui.keyDown('input.edit', 'Enter')

            expect(scope.actions.onKeyDown).toHaveBeenCalledOnce()
            const [getValue, event] = vi.mocked(scope.actions.onKeyDown).mock.calls[0]
            // A getter, not a value: the presenter reads the field at the moment
            // it decides, which is what lets the field stay uncontrolled.
            expect(getValue()).toEqual('Go to school early')
            expect(event.code).toEqual('Enter')
        })

        it('hands the same getter to onBlur', () => {
            const scope = anItem({ editing: true })
            ui = new Rendered().render(<ItemView scope={scope} />)

            ui.type('input.edit', 'Edited away')
            ui.blur('input.edit')

            expect(scope.actions.onBlur).toHaveBeenCalledOnce()
            expect(vi.mocked(scope.actions.onBlur).mock.calls[0][0]()).toEqual('Edited away')
        })
    })

    it('focuses the edit field with the caret at the end', () => {
        const scope = anItem({ editing: true, title: 'Go to school' })
        ui = new Rendered().render(<ItemView scope={scope} />)

        const field = ui.get<HTMLInputElement>('input.edit')
        expect(document.activeElement).toBe(field)
        expect(field.selectionStart).toEqual('Go to school'.length)
    })
})
