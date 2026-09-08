import { afterEach, describe, expect, it, vi } from 'vitest'
import { ViewFactory } from 'wdc-cube-webc'
import { HeaderScope } from 'wdc-cube-tutorial-presentation/todo-mvc'

import { renderView, type Rendered } from '../../../test/render'
import { registerViews } from './index'

registerViews(ViewFactory.define)

let ui: Rendered<HeaderScope> | undefined

afterEach(() => {
    ui?.unmount()
    ui = undefined
})

function aHeader(
    overrides: Partial<Pick<HeaderScope, 'inputValue' | 'allItemsCompleted' | 'toggleButtonVisible'>> = {}
) {
    const scope = new HeaderScope()
    scope.inputValue = overrides.inputValue ?? ''
    scope.allItemsCompleted = overrides.allItemsCompleted ?? false
    scope.toggleButtonVisible = overrides.toggleButtonVisible ?? true

    // The presenter mirrors the field into the scope synchronously, and does it
    // outside an action so no update is triggered. The view depends on that.
    scope.actions.onSyncInputChange = vi.fn((value: string) => {
        scope.inputValue = value
    })
    scope.actions.onSyncInputKeyDown = vi.fn()
    scope.actions.onToggleAll = vi.fn()

    return scope
}

describe('HeaderView', () => {
    describe('drawing the scope', () => {
        it('starts the field from the scope value', () => {
            ui = renderView('v-todo-header', aHeader({ inputValue: 'half typed' }))

            expect(ui.get<HTMLInputElement>('input.newTodo').value).toEqual('half typed')
        })

        it('checks toggle-all only while something is still active', () => {
            ui = renderView('v-todo-header', aHeader({ allItemsCompleted: false }))
            expect(ui.get<HTMLInputElement>('input.toggleAll').checked).toBe(true)

            ui.unmount()
            ui = renderView('v-todo-header', aHeader({ allItemsCompleted: true }))
            expect(ui.get<HTMLInputElement>('input.toggleAll').checked).toBe(false)
        })

        it('hides the toggle-all label while the list is empty', () => {
            ui = renderView('v-todo-header', aHeader({ toggleButtonVisible: false }))

            expect(ui.get('label').classList).toContain('hidden')
        })

        it('redraws when the scope says so', () => {
            const scope = aHeader({ toggleButtonVisible: false })
            ui = renderView('v-todo-header', scope)

            ui.act(() => {
                scope.toggleButtonVisible = true
                scope.forceUpdate()
            })

            expect(ui.get('label').classList).not.toContain('hidden')
        })
    })

    describe('firing actions', () => {
        it('reports each keystroke', () => {
            const scope = aHeader()
            ui = renderView('v-todo-header', scope)

            ui.type('input.newTodo', 'Wr')
            ui.type('input.newTodo', 'Write')

            expect(scope.actions.onSyncInputChange).toHaveBeenNthCalledWith(1, 'Wr')
            expect(scope.actions.onSyncInputChange).toHaveBeenNthCalledWith(2, 'Write')
        })

        it('passes the key event through', () => {
            const scope = aHeader()
            ui = renderView('v-todo-header', scope)

            ui.keyDown('input.newTodo', 'Enter')

            expect(scope.actions.onSyncInputKeyDown).toHaveBeenCalledOnce()
            expect(vi.mocked(scope.actions.onSyncInputKeyDown).mock.calls[0][0].code).toEqual('Enter')
        })

        it('toggles all on the checkbox', () => {
            const scope = aHeader()
            ui = renderView('v-todo-header', scope)

            ui.dispatch('input.toggleAll', new Event('change', { bubbles: true }))

            expect(scope.actions.onToggleAll).toHaveBeenCalledOnce()
        })
    })

    /**
     * The field is uncontrolled here for the same reason it is in the other three
     * renderers, and `setValue` is what keeps it honest: it writes only when the
     * DOM and the scope disagree, so a redraw never interrupts typing.
     */
    describe('the uncontrolled field', () => {
        it('leaves typing alone across a redraw', () => {
            const scope = aHeader()
            ui = renderView('v-todo-header', scope)

            ui.type('input.newTodo', 'Write the tests')
            ui.act(() => scope.forceUpdate())

            expect(ui.get<HTMLInputElement>('input.newTodo').value).toEqual('Write the tests')
        })

        it('lets the presenter clear it', () => {
            const scope = aHeader()
            ui = renderView('v-todo-header', scope)
            ui.type('input.newTodo', 'Write the tests')

            // What the presenter does on Enter.
            ui.act(() => {
                scope.inputValue = ''
                scope.forceUpdate()
            })

            expect(ui.get<HTMLInputElement>('input.newTodo').value).toEqual('')
        })

        it('overwrites the field when the scope failed to keep up', () => {
            const scope = aHeader({ inputValue: 'from the presenter' })
            ui = renderView('v-todo-header', scope)

            ui.get<HTMLInputElement>('input.newTodo').value = 'typed behind its back'
            ui.act(() => {
                scope.inputValue = 'from the presenter again'
                scope.forceUpdate()
            })

            expect(ui.get<HTMLInputElement>('input.newTodo').value).toEqual('from the presenter again')
        })
    })
})
