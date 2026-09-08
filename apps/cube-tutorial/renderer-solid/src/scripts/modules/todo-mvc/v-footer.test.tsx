import { afterEach, describe, expect, it, vi } from 'vitest'
import { FooterScope, ShowingOptions } from 'wdc-cube-tutorial-presentation/todo-mvc'

import { Rendered } from '../../../test/render'
import { FooterView } from './v-footer'

let ui: Rendered | undefined

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
            ui = new Rendered().render(() => <FooterView scope={aFooter({ count: 1, activeTodoWord: 'item' })} />)

            expect(ui.text('.todoCount')).toEqual('1 item left')
        })

        it('offers all three filters, in order', () => {
            ui = new Rendered().render(() => <FooterView scope={aFooter()} />)

            expect(ui.all('.filters a').map((a) => a.textContent)).toEqual(['All', 'Active', 'Completed'])
        })

        it('marks exactly the filter in force', () => {
            ui = new Rendered().render(() => <FooterView scope={aFooter({ showing: ShowingOptions.ACTIVE })} />)

            expect(ui.all('.filters a').map((a) => a.classList.contains('selected'))).toEqual([false, true, false])
        })

        it('shows the clear button only when the scope asks for it', () => {
            ui = new Rendered().render(() => <FooterView scope={aFooter({ clearButtonVisible: false })} />)
            expect(ui.has('button.clearCompleted')).toBe(false)

            ui.unmount()
            ui = new Rendered().render(() => <FooterView scope={aFooter({ clearButtonVisible: true })} />)
            expect(ui.has('button.clearCompleted')).toBe(true)
        })

        it('redraws when the scope says so', () => {
            const scope = aFooter({ count: 2 })
            ui = new Rendered().render(() => <FooterView scope={scope} />)

            ui.act(() => {
                scope.count = 7
                scope.forceUpdate()
            })

            expect(ui.text('.todoCount')).toEqual('7 items left')
        })

        it('moves the mark without rebuilding the links', () => {
            const scope = aFooter({ showing: ShowingOptions.ALL })
            ui = new Rendered().render(() => <FooterView scope={scope} />)

            const links = ui.all('.filters a')
            ui.act(() => (scope.showing = ShowingOptions.COMPLETED))

            expect(ui.all('.filters a')).toEqual(links)
            expect(ui.all('.filters a').map((a) => a.classList.contains('selected'))).toEqual([false, false, true])
        })
    })

    describe('firing actions', () => {
        it('fires the filter the link stands for', () => {
            const scope = aFooter()
            ui = new Rendered().render(() => <FooterView scope={scope} />)

            ui.click('.filters li:nth-child(2) a')

            expect(scope.actions.onShowActives).toHaveBeenCalledOnce()
            expect(scope.actions.onShowAll).not.toHaveBeenCalled()
        })

        it('clears completed on the button', () => {
            const scope = aFooter({ clearButtonVisible: true })
            ui = new Rendered().render(() => <FooterView scope={scope} />)

            ui.click('button.clearCompleted')

            expect(scope.actions.onClearCompleted).toHaveBeenCalledOnce()
        })
    })
})
