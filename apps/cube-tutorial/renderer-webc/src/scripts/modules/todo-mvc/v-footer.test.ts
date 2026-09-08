import { afterEach, describe, expect, it, vi } from 'vitest'
import { ViewFactory } from 'wdc-cube-webc'
import { FooterScope, ShowingOptions } from 'wdc-cube-tutorial-presentation/todo-mvc'

import { renderView, type Rendered } from '../../../test/render'
import { registerViews } from './index'

registerViews(ViewFactory.define)

let ui: Rendered<FooterScope> | undefined

afterEach(() => {
    ui?.unmount()
    ui = undefined
})

function aFooter(
    overrides: Partial<Pick<FooterScope, 'count' | 'activeTodoWord' | 'clearButtonVisible' | 'showing'>> = {}
) {
    const scope = new FooterScope()
    scope.count = overrides.count ?? 2
    scope.activeTodoWord = overrides.activeTodoWord ?? 'items'
    scope.clearButtonVisible = overrides.clearButtonVisible ?? false
    scope.showing = overrides.showing ?? ShowingOptions.ALL

    scope.actions.onClearCompleted = vi.fn()
    scope.actions.onShowAll = vi.fn()
    scope.actions.onShowActives = vi.fn()
    scope.actions.onShowCompleteds = vi.fn()

    return scope
}

describe('FooterView', () => {
    describe('drawing the scope', () => {
        it('shows the count with the word the scope chose', () => {
            ui = renderView('v-todo-footer', aFooter({ count: 1, activeTodoWord: 'item' }))

            expect(ui.text('.todoCount')).toEqual('1 item left')
        })

        it('offers all three filters, in order', () => {
            ui = renderView('v-todo-footer', aFooter())

            expect(ui.all('.filters a').map((a) => a.textContent)).toEqual(['All', 'Active', 'Completed'])
        })

        it('marks exactly the filter in force', () => {
            ui = renderView('v-todo-footer', aFooter({ showing: ShowingOptions.ACTIVE }))

            expect(ui.all('.filters a').map((a) => a.classList.contains('selected'))).toEqual([false, true, false])
        })

        /**
         * `setVisible` hides with the `hidden` attribute rather than removing the
         * element, which is what "declare once" means: the button exists from the
         * first draw and only its visibility moves.
         */
        it('hides the clear button rather than removing it', () => {
            ui = renderView('v-todo-footer', aFooter({ clearButtonVisible: false }))

            expect(ui.has('button.clearCompleted')).toBe(true)
            expect(ui.visible('button.clearCompleted')).toBe(false)
        })

        it('redraws when the scope says so', () => {
            const scope = aFooter({ count: 2 })
            ui = renderView('v-todo-footer', scope)

            ui.act(() => {
                scope.count = 7
                scope.clearButtonVisible = true
                scope.forceUpdate()
            })

            expect(ui.text('.todoCount')).toEqual('7 items left')
            expect(ui.visible('button.clearCompleted')).toBe(true)
        })

        it('moves the mark without rebuilding the links', () => {
            const scope = aFooter({ showing: ShowingOptions.ALL })
            ui = renderView('v-todo-footer', scope)

            const links = ui.all('.filters a')
            ui.act(() => {
                scope.showing = ShowingOptions.COMPLETED
                scope.forceUpdate()
            })

            expect(ui.all('.filters a')).toEqual(links)
            expect(ui.all('.filters a').map((a) => a.classList.contains('selected'))).toEqual([false, false, true])
        })
    })

    describe('firing actions', () => {
        it('fires the filter the link stands for', () => {
            const scope = aFooter()
            ui = renderView('v-todo-footer', scope)

            ui.click('.filters li:nth-child(2) a')

            expect(scope.actions.onShowActives).toHaveBeenCalledOnce()
            expect(scope.actions.onShowAll).not.toHaveBeenCalled()
        })

        it('clears completed on the button', () => {
            const scope = aFooter({ clearButtonVisible: true })
            ui = renderView('v-todo-footer', scope)

            ui.click('button.clearCompleted')

            expect(scope.actions.onClearCompleted).toHaveBeenCalledOnce()
        })
    })
})
