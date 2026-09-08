import { afterEach, describe, expect, it, vi } from 'vitest'
import { HeaderScope } from 'wdc-cube-tutorial-presentation/todo-mvc'

import { renderView, type Rendered } from '../../../test/render'
import { HeaderView } from './v-header'

let ui: Rendered<HeaderView> | undefined

afterEach(() => {
    ui?.destroy()
    ui = undefined
})

type HeaderState = Pick<HeaderScope, 'inputValue' | 'allItemsCompleted' | 'toggleButtonVisible'>

function aHeader(overrides: Partial<HeaderState> = {}) {
    const scope = new HeaderScope()
    scope.inputValue = overrides.inputValue ?? ''
    scope.allItemsCompleted = overrides.allItemsCompleted ?? false
    scope.toggleButtonVisible = overrides.toggleButtonVisible ?? true

    // The presenter mirrors the field into the scope synchronously, and does it
    // outside an action so no update is triggered. The view depends on that; see
    // the last block.
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
            ui = renderView(HeaderView, aHeader({ inputValue: 'half typed' }))

            expect(ui.get<HTMLInputElement>('input.new-todo').value).toEqual('half typed')
        })

        it('checks toggle-all only while something is still active', () => {
            ui = renderView(HeaderView, aHeader({ allItemsCompleted: false }))
            expect(ui.get<HTMLInputElement>('input.toggle-all').checked).toEqual(true)

            ui.destroy()
            ui = renderView(HeaderView, aHeader({ allItemsCompleted: true }))
            expect(ui.get<HTMLInputElement>('input.toggle-all').checked).toEqual(false)
        })

        it('hides the toggle-all label while the list is empty', () => {
            ui = renderView(HeaderView, aHeader({ toggleButtonVisible: false }))

            expect(ui.get<HTMLLabelElement>('label').style.opacity).toEqual('0')
        })
    })

    describe('firing actions', () => {
        it('reports each keystroke', () => {
            const scope = aHeader()
            ui = renderView(HeaderView, scope)

            ui.type('input.new-todo', 'Wr')
            ui.type('input.new-todo', 'Write')

            expect(scope.actions.onSyncInputChange).toHaveBeenNthCalledWith(1, 'Wr')
            expect(scope.actions.onSyncInputChange).toHaveBeenNthCalledWith(2, 'Write')
        })

        it('passes the key event through', () => {
            const scope = aHeader()
            ui = renderView(HeaderView, scope)

            ui.keyDown('input.new-todo', 'Enter')

            expect(scope.actions.onSyncInputKeyDown).toHaveBeenCalledOnce()
            expect(vi.mocked(scope.actions.onSyncInputKeyDown).mock.calls[0][0].code).toEqual('Enter')
        })

        it('toggles all on the checkbox', () => {
            const scope = aHeader()
            ui = renderView(HeaderView, scope)

            ui.dispatch(ui.get('input.toggle-all'), new Event('change', { bubbles: true }))

            expect(scope.actions.onToggleAll).toHaveBeenCalledOnce()
        })
    })

    /**
     * The field is uncontrolled here too, though for a different reason than in
     * React. Angular's `[value]` binding does not lose keystrokes — it writes on
     * change rather than restoring after every event — but it can fail to
     * *clear*: type and press Enter inside one flush window and the scope returns
     * to the value Angular already believes, so it never writes and the text
     * stays. An after-render hook pushes the scope value in when the two
     * disagree.
     */
    describe('the uncontrolled field', () => {
        it('leaves typing alone across a redraw', () => {
            const scope = aHeader()
            ui = renderView(HeaderView, scope)

            ui.type('input.new-todo', 'Write the tests')
            ui.act(() => scope.forceUpdate())

            expect(ui.get<HTMLInputElement>('input.new-todo').value).toEqual('Write the tests')
        })

        it('lets the presenter clear it', () => {
            const scope = aHeader()
            ui = renderView(HeaderView, scope)
            ui.type('input.new-todo', 'Write the tests')

            // What the presenter does on Enter.
            ui.act(() => {
                scope.inputValue = ''
                scope.forceUpdate()
            })

            expect(ui.get<HTMLInputElement>('input.new-todo').value).toEqual('')
        })

        // The hook cannot tell who changed what: it only sees that the field and
        // the scope disagree, and makes the scope win. So the field survives only
        // because onSyncInputChange mirrors it synchronously — the same coupling
        // the React view has, reached from the opposite direction.
        it('overwrites the field when the scope failed to keep up', () => {
            const scope = aHeader()
            scope.actions.onSyncInputChange = vi.fn() // a scope that never mirrors
            ui = renderView(HeaderView, scope)

            ui.type('input.new-todo', 'Write the tests')
            ui.act(() => scope.forceUpdate())

            expect(ui.get<HTMLInputElement>('input.new-todo').value).toEqual('')
        })
    })
})
