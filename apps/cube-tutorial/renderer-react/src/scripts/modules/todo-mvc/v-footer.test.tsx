import { afterEach, describe, expect, it, vi } from 'vitest'
import { FooterScope, ShowingOptions } from 'wdc-cube-tutorial-presentation/todo-mvc'

import { Rendered } from '../../../test/render'
import { FooterView } from './v-footer'

let ui: Rendered | undefined

afterEach(() => {
    ui?.unmount()
    ui = undefined
})

type FooterState = Pick<FooterScope, 'count' | 'activeTodoWord' | 'clearButtonVisible' | 'showing'>

function aFooter(overrides: Partial<FooterState> = {}) {
    const scope = new FooterScope()
    scope.count = overrides.count ?? 2
    scope.activeTodoWord = overrides.activeTodoWord ?? 'items'
    scope.clearButtonVisible = overrides.clearButtonVisible ?? true
    scope.showing = overrides.showing ?? ShowingOptions.ALL

    scope.actions.onClearCompleted = vi.fn()
    scope.actions.onShowAll = vi.fn()
    scope.actions.onShowActives = vi.fn()
    scope.actions.onShowCompleteds = vi.fn()

    return scope
}

const filters = (ui: Rendered) => ui.all('.filters a')
const selected = (ui: Rendered) =>
    filters(ui)
        .filter((a) => a.classList.contains('selected'))
        .map((a) => a.textContent)

describe('FooterView', () => {
    describe('drawing the scope', () => {
        it('shows the count with the word the scope chose', () => {
            ui = new Rendered().render(<FooterView scope={aFooter({ count: 2, activeTodoWord: 'items' })} />)
            expect(ui.text('.todoCount')).toEqual('2 items left')

            ui.unmount()
            ui = new Rendered().render(<FooterView scope={aFooter({ count: 1, activeTodoWord: 'item' })} />)
            expect(ui.text('.todoCount')).toEqual('1 item left')
        })

        it('marks exactly the filter in force', () => {
            ui = new Rendered().render(<FooterView scope={aFooter({ showing: ShowingOptions.ALL })} />)
            expect(selected(ui)).toEqual(['All'])

            ui.unmount()
            ui = new Rendered().render(<FooterView scope={aFooter({ showing: ShowingOptions.ACTIVE })} />)
            expect(selected(ui)).toEqual(['Active'])

            ui.unmount()
            ui = new Rendered().render(<FooterView scope={aFooter({ showing: ShowingOptions.COMPLETED })} />)
            expect(selected(ui)).toEqual(['Completed'])
        })

        it('offers all three filters, in order', () => {
            ui = new Rendered().render(<FooterView scope={aFooter()} />)

            expect(filters(ui).map((a) => a.textContent)).toEqual(['All', 'Active', 'Completed'])
        })

        it('shows the clear button only when the scope asks for it', () => {
            ui = new Rendered().render(<FooterView scope={aFooter({ clearButtonVisible: true })} />)
            expect(ui.has('.clearCompleted')).toEqual(true)

            ui.unmount()
            ui = new Rendered().render(<FooterView scope={aFooter({ clearButtonVisible: false })} />)
            expect(ui.has('.clearCompleted')).toEqual(false)
        })
    })

    describe('firing actions', () => {
        it('fires the filter the link stands for', () => {
            const scope = aFooter()
            ui = new Rendered().render(<FooterView scope={scope} />)

            const [all, active, completed] = filters(ui)

            ui.act(() => all.dispatchEvent(new MouseEvent('click', { bubbles: true })))
            expect(scope.actions.onShowAll).toHaveBeenCalledOnce()

            ui.act(() => active.dispatchEvent(new MouseEvent('click', { bubbles: true })))
            expect(scope.actions.onShowActives).toHaveBeenCalledOnce()

            ui.act(() => completed.dispatchEvent(new MouseEvent('click', { bubbles: true })))
            expect(scope.actions.onShowCompleteds).toHaveBeenCalledOnce()
        })

        it('clears completed on the button', () => {
            const scope = aFooter()
            ui = new Rendered().render(<FooterView scope={scope} />)

            ui.click('.clearCompleted')

            expect(scope.actions.onClearCompleted).toHaveBeenCalledOnce()
        })
    })

    it('redraws when the scope says so', () => {
        const scope = aFooter({ count: 2, activeTodoWord: 'items', clearButtonVisible: true })
        ui = new Rendered().render(<FooterView scope={scope} />)

        ui.act(() => {
            scope.count = 0
            scope.activeTodoWord = 'item'
            scope.clearButtonVisible = false
            scope.showing = ShowingOptions.COMPLETED
            scope.forceUpdate()
        })

        expect(ui.text('.todoCount')).toEqual('0 item left')
        expect(ui.has('.clearCompleted')).toEqual(false)
        expect(selected(ui)).toEqual(['Completed'])
    })
})
