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
            ui = new Rendered().render(<HeaderView scope={aHeader({ inputValue: 'half typed' })} />)

            expect(ui.get<HTMLInputElement>('input.newTodo').value).toEqual('half typed')
        })

        it('checks toggle-all only while something is still active', () => {
            ui = new Rendered().render(<HeaderView scope={aHeader({ allItemsCompleted: false })} />)
            expect(ui.get<HTMLInputElement>('input.toggleAll').checked).toEqual(true)

            ui.unmount()
            ui = new Rendered().render(<HeaderView scope={aHeader({ allItemsCompleted: true })} />)
            expect(ui.get<HTMLInputElement>('input.toggleAll').checked).toEqual(false)
        })

        it('hides the toggle-all label while the list is empty', () => {
            ui = new Rendered().render(<HeaderView scope={aHeader({ toggleButtonVisible: false })} />)

            expect(ui.get<HTMLLabelElement>('label').style.opacity).toEqual('0')
        })
    })

    describe('firing actions', () => {
        it('reports each keystroke', () => {
            const scope = aHeader()
            ui = new Rendered().render(<HeaderView scope={scope} />)

            ui.type('input.newTodo', 'Wr')
            ui.type('input.newTodo', 'Write')

            expect(scope.actions.onSyncInputChange).toHaveBeenNthCalledWith(1, 'Wr')
            expect(scope.actions.onSyncInputChange).toHaveBeenNthCalledWith(2, 'Write')
        })

        it('passes the key event through', () => {
            const scope = aHeader()
            ui = new Rendered().render(<HeaderView scope={scope} />)

            ui.keyDown('input.newTodo', 'Enter')

            expect(scope.actions.onSyncInputKeyDown).toHaveBeenCalledOnce()
            expect(vi.mocked(scope.actions.onSyncInputKeyDown).mock.calls[0][0].code).toEqual('Enter')
        })

        it('toggles all on the checkbox', () => {
            const scope = aHeader()
            ui = new Rendered().render(<HeaderView scope={scope} />)

            ui.click('input.toggleAll')

            expect(scope.actions.onToggleAll).toHaveBeenCalledOnce()
        })
    })

    /**
     * The field is uncontrolled on purpose: a controlled one backed by an
     * asynchronously updated scope dropped characters, because React restores a
     * controlled value at the end of every event while the scope had not caught
     * up yet. What replaces that restoring is an after-render hook that writes
     * the scope value into the DOM whenever the two disagree.
     */
    describe('the uncontrolled field', () => {
        it('leaves typing alone across a redraw', () => {
            const scope = aHeader()
            ui = new Rendered().render(<HeaderView scope={scope} />)

            ui.type('input.newTodo', 'Write the tests')
            ui.act(() => scope.forceUpdate())

            expect(ui.get<HTMLInputElement>('input.newTodo').value).toEqual('Write the tests')
        })

        it('lets the presenter clear it', () => {
            const scope = aHeader()
            ui = new Rendered().render(<HeaderView scope={scope} />)
            ui.type('input.newTodo', 'Write the tests')

            // What the presenter does on Enter.
            ui.act(() => {
                scope.inputValue = ''
                scope.forceUpdate()
            })

            expect(ui.get<HTMLInputElement>('input.newTodo').value).toEqual('')
        })

        // The hook cannot tell who changed what: it only sees that the field and
        // the scope disagree, and makes the scope win. So the field survives only
        // because onSyncInputChange mirrors it synchronously. Turn that into an
        // ordinary action and the scope lags a frame, the hook writes the stale
        // value back, and the keystrokes are gone again — the very bug the
        // uncontrolled field was meant to end. This test is here to say so.
        it('overwrites the field when the scope failed to keep up', () => {
            const scope = aHeader()
            scope.actions.onSyncInputChange = vi.fn() // a scope that never mirrors
            ui = new Rendered().render(<HeaderView scope={scope} />)

            ui.type('input.newTodo', 'Write the tests')
            ui.act(() => scope.forceUpdate())

            expect(ui.get<HTMLInputElement>('input.newTodo').value).toEqual('')
        })
    })
})
