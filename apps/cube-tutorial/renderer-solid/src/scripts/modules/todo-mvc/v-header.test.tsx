import { afterEach, describe, expect, it, vi } from 'vitest'
import { HeaderScope } from 'wdc-cube-tutorial-presentation/todo-mvc'

import { Rendered } from '../../../test/render'
import { HeaderView } from './v-header'

let ui: Rendered | undefined

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
            ui = new Rendered().render(() => <HeaderView scope={aHeader({ inputValue: 'half typed' })} />)

            expect(ui.get<HTMLInputElement>('input.newTodo').value).toEqual('half typed')
        })

        it('checks toggle-all only while something is still active', () => {
            ui = new Rendered().render(() => <HeaderView scope={aHeader({ allItemsCompleted: false })} />)
            expect(ui.get<HTMLInputElement>('input.toggleAll').checked).toBe(true)

            ui.unmount()
            ui = new Rendered().render(() => <HeaderView scope={aHeader({ allItemsCompleted: true })} />)
            expect(ui.get<HTMLInputElement>('input.toggleAll').checked).toBe(false)
        })

        it('hides the toggle-all label while the list is empty', () => {
            ui = new Rendered().render(() => <HeaderView scope={aHeader({ toggleButtonVisible: false })} />)

            expect(ui.get('label').style.opacity).toEqual('0')
        })
    })

    describe('firing actions', () => {
        it('reports each keystroke', () => {
            const scope = aHeader()
            ui = new Rendered().render(() => <HeaderView scope={scope} />)

            ui.type('input.newTodo', 'Wr')
            ui.type('input.newTodo', 'Write')

            expect(scope.actions.onSyncInputChange).toHaveBeenNthCalledWith(1, 'Wr')
            expect(scope.actions.onSyncInputChange).toHaveBeenNthCalledWith(2, 'Write')
        })

        it('passes the key event through', () => {
            const scope = aHeader()
            ui = new Rendered().render(() => <HeaderView scope={scope} />)

            ui.keyDown('input.newTodo', 'Enter')

            expect(scope.actions.onSyncInputKeyDown).toHaveBeenCalledOnce()
            expect(vi.mocked(scope.actions.onSyncInputKeyDown).mock.calls[0][0].code).toEqual('Enter')
        })

        it('toggles all on the checkbox', () => {
            const scope = aHeader()
            ui = new Rendered().render(() => <HeaderView scope={scope} />)

            ui.click('input.toggleAll')

            expect(scope.actions.onToggleAll).toHaveBeenCalledOnce()
        })
    })

    /**
     * The field is uncontrolled here for the same reason it is in React and
     * Angular, and the effect that keeps it honest is the one difference: Solid
     * re-runs it when `inputValue` moves and at no other time, so a keystroke
     * never has to race a redraw of anything else.
     */
    describe('the uncontrolled field', () => {
        it('leaves typing alone across a redraw', () => {
            const scope = aHeader()
            ui = new Rendered().render(() => <HeaderView scope={scope} />)

            ui.type('input.newTodo', 'Write the tests')
            ui.act(() => scope.forceUpdate())

            expect(ui.get<HTMLInputElement>('input.newTodo').value).toEqual('Write the tests')
        })

        it('lets the presenter clear it', () => {
            const scope = aHeader()
            ui = new Rendered().render(() => <HeaderView scope={scope} />)
            ui.type('input.newTodo', 'Write the tests')

            // What the presenter does on Enter.
            ui.act(() => (scope.inputValue = ''))

            expect(ui.get<HTMLInputElement>('input.newTodo').value).toEqual('')
        })

        it('overwrites the field when the scope failed to keep up', () => {
            const scope = aHeader({ inputValue: 'from the presenter' })
            ui = new Rendered().render(() => <HeaderView scope={scope} />)

            ui.get<HTMLInputElement>('input.newTodo').value = 'typed behind its back'
            ui.act(() => (scope.inputValue = 'from the presenter again'))

            expect(ui.get<HTMLInputElement>('input.newTodo').value).toEqual('from the presenter again')
        })
    })
})
