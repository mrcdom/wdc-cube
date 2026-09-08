import { afterEach, describe, expect, it, vi } from 'vitest'
import { ViewFactory } from 'wdc-cube-webc'
import { ItemScope } from 'wdc-cube-tutorial-presentation/todo-mvc'

import { renderView, type Rendered } from '../../../test/render'
import { registerViews } from './index'

registerViews(ViewFactory.define)

let ui: Rendered<ItemScope> | undefined

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
            ui = renderView('v-todo-item', anItem({ title: 'Write the tests' }))

            expect(ui.text('label')).toEqual('Write the tests')
            expect(ui.get<HTMLInputElement>('input.toggle').checked).toBe(false)
            expect(ui.get('li').classList).not.toContain('completed')
        })

        it('marks the row completed and checks the box', () => {
            ui = renderView('v-todo-item', anItem({ completed: true }))

            expect(ui.get<HTMLInputElement>('input.toggle').checked).toBe(true)
            expect(ui.get('li').classList).toContain('completed')
        })

        it('marks the row for editing and fills the field from the title', () => {
            ui = renderView('v-todo-item', anItem({ editing: true, title: 'Half typed' }))

            expect(ui.get('li').classList).toContain('editing')
            expect(ui.get<HTMLInputElement>('input.edit').value).toEqual('Half typed')
        })

        it('redraws when the scope says so', () => {
            const scope = anItem()
            ui = renderView('v-todo-item', scope)

            ui.act(() => {
                scope.title = 'Another title'
                scope.forceUpdate()
            })

            expect(ui.text('label')).toEqual('Another title')
        })

        /**
         * The whole point of declaring once: a redraw writes over the tree it
         * already built. Nothing is created, so nothing that was holding state
         * loses it.
         */
        it('writes over the tree it built rather than building another', () => {
            const scope = anItem()
            ui = renderView('v-todo-item', scope)

            const row = ui.get('li')
            const label = ui.get('label')
            const toggle = ui.get<HTMLInputElement>('input.toggle')

            ui.act(() => {
                scope.title = 'Another title'
                scope.completed = true
                scope.forceUpdate()
            })

            expect(ui.get('li')).toBe(row)
            expect(ui.get('label')).toBe(label)
            expect(ui.get('input.toggle')).toBe(toggle)
            expect(label.textContent).toEqual('Another title')
            expect(toggle.checked).toBe(true)
        })
    })

    describe('firing actions', () => {
        it('toggles on the checkbox', () => {
            const scope = anItem()
            ui = renderView('v-todo-item', scope)

            ui.click('input.toggle')

            expect(scope.actions.onToggle).toHaveBeenCalledOnce()
        })

        it('edits on a double click, and not on a single one', () => {
            const scope = anItem()
            ui = renderView('v-todo-item', scope)

            ui.click('label')
            expect(scope.actions.onEdit).not.toHaveBeenCalled()

            ui.doubleClick('label')
            expect(scope.actions.onEdit).toHaveBeenCalledOnce()
        })

        it('destroys on the button', () => {
            const scope = anItem()
            ui = renderView('v-todo-item', scope)

            ui.click('button.destroy')

            expect(scope.actions.onDestroy).toHaveBeenCalledOnce()
        })

        it('hands a getter for the edit field to onKeyDown, read when asked', () => {
            const scope = anItem({ editing: true })
            ui = renderView('v-todo-item', scope)

            ui.get<HTMLInputElement>('input.edit').value = 'Edited after the event'
            ui.keyDown('input.edit', 'Enter')

            const [getValue, event] = vi.mocked(scope.actions.onKeyDown).mock.calls[0]
            expect(getValue()).toEqual('Edited after the event')
            expect(event.code).toEqual('Enter')
        })

        it('hands the same getter to onBlur', () => {
            const scope = anItem({ editing: true })
            ui = renderView('v-todo-item', scope)

            ui.get<HTMLInputElement>('input.edit').value = 'Edited after the event'
            ui.blur('input.edit')

            expect(vi.mocked(scope.actions.onBlur).mock.calls[0][0]()).toEqual('Edited after the event')
        })
    })
})
