import { afterEach, describe, expect, it, vi } from 'vitest'
import { FooterScope, ShowingOptions } from 'wdc-cube-tutorial-core/todo-mvc'

import { renderView, type Rendered } from '../../../test/render'
import { FooterView } from './v-footer'

let ui: Rendered<FooterView> | undefined

afterEach(() => {
    ui?.destroy()
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

const filters = (ui: Rendered<FooterView>) => ui.all('.filters a')
const selected = (ui: Rendered<FooterView>) =>
    filters(ui)
        .filter((a) => a.classList.contains('selected'))
        .map((a) => a.textContent?.trim())

describe('FooterView', () => {
    describe('drawing the scope', () => {
        it('shows the count with the word the scope chose', () => {
            ui = renderView(FooterView, aFooter({ count: 2, activeTodoWord: 'items' }))
            expect(ui.text('.todo-count')).toEqual('2 items left')

            ui.destroy()
            ui = renderView(FooterView, aFooter({ count: 1, activeTodoWord: 'item' }))
            expect(ui.text('.todo-count')).toEqual('1 item left')
        })

        it('marks exactly the filter in force', () => {
            ui = renderView(FooterView, aFooter({ showing: ShowingOptions.ALL }))
            expect(selected(ui)).toEqual(['All'])

            ui.destroy()
            ui = renderView(FooterView, aFooter({ showing: ShowingOptions.ACTIVE }))
            expect(selected(ui)).toEqual(['Active'])

            ui.destroy()
            ui = renderView(FooterView, aFooter({ showing: ShowingOptions.COMPLETED }))
            expect(selected(ui)).toEqual(['Completed'])
        })

        it('offers all three filters, in order', () => {
            ui = renderView(FooterView, aFooter())

            expect(filters(ui).map((a) => a.textContent?.trim())).toEqual(['All', 'Active', 'Completed'])
        })

        it('shows the clear button only when the scope asks for it', () => {
            ui = renderView(FooterView, aFooter({ clearButtonVisible: true }))
            expect(ui.has('.clear-completed')).toEqual(true)

            ui.destroy()
            ui = renderView(FooterView, aFooter({ clearButtonVisible: false }))
            expect(ui.has('.clear-completed')).toEqual(false)
        })
    })

    describe('firing actions', () => {
        it('fires the filter the link stands for', () => {
            const scope = aFooter()
            ui = renderView(FooterView, scope)

            const [all, active, completed] = filters(ui)

            ui.dispatch(all, new MouseEvent('click', { bubbles: true }))
            expect(scope.actions.onShowAll).toHaveBeenCalledOnce()

            ui.dispatch(active, new MouseEvent('click', { bubbles: true }))
            expect(scope.actions.onShowActives).toHaveBeenCalledOnce()

            ui.dispatch(completed, new MouseEvent('click', { bubbles: true }))
            expect(scope.actions.onShowCompleteds).toHaveBeenCalledOnce()
        })

        it('clears completed on the button', () => {
            const scope = aFooter()
            ui = renderView(FooterView, scope)

            ui.click('.clear-completed')

            expect(scope.actions.onClearCompleted).toHaveBeenCalledOnce()
        })
    })

    it('redraws when the scope says so', () => {
        const scope = aFooter({ count: 2, activeTodoWord: 'items', clearButtonVisible: true })
        ui = renderView(FooterView, scope)

        ui.act(() => {
            scope.count = 0
            scope.activeTodoWord = 'item'
            scope.clearButtonVisible = false
            scope.showing = ShowingOptions.COMPLETED
            scope.forceUpdate()
        })

        expect(ui.text('.todo-count')).toEqual('0 item left')
        expect(ui.has('.clear-completed')).toEqual(false)
        expect(selected(ui)).toEqual(['Completed'])
    })
})
