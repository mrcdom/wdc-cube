import { afterEach, describe, expect, it, vi } from 'vitest'
import { SubscriptionsScope, type SiteItemType } from 'wdc-cube-tutorial-app/subscriptions'

import { renderView, type Rendered } from '../../../test/render'
import { SubscriptionsView } from './v-subscriptions'

let ui: Rendered<SubscriptionsView> | undefined

afterEach(() => {
    ui?.destroy()
    ui = undefined
})

const SITES: SiteItemType[] = [
    { id: 1, site: 'youtube.com' },
    { id: 2, site: 'twitter.com' },
    { id: 3, site: 'gettr.com' }
]

function aList(sites: SiteItemType[] = SITES) {
    const scope = new SubscriptionsScope()
    scope.sites = sites
    scope.onItemClicked = vi.fn()
    return scope
}

const rows = (ui: Rendered<SubscriptionsView>) => ui.all('mat-action-list button').map((b) => b.textContent?.trim())

describe('SubscriptionsView', () => {
    describe('drawing the scope', () => {
        it('lists a row per site, in the order given', () => {
            ui = renderView(SubscriptionsView, aList())

            expect(rows(ui)).toEqual(['youtube.com', 'twitter.com', 'gettr.com'])
        })

        it('draws nothing but the heading for an empty list', () => {
            ui = renderView(SubscriptionsView, aList([]))

            expect(rows(ui)).toEqual([])
            expect(ui.text('h1')).toEqual('Sites you can subscribe to...')
        })

        it('names the list for a screen reader', () => {
            ui = renderView(SubscriptionsView, aList())

            expect(ui.get('mat-action-list').getAttribute('aria-label')).toEqual('Sites you can subscribe to')
        })
    })

    describe('firing actions', () => {
        it('reports the site that was clicked, not just its position', () => {
            const scope = aList()
            ui = renderView(SubscriptionsView, scope)

            const twitter = ui.all('mat-action-list button')[1]
            ui.dispatch(twitter, new MouseEvent('click', { bubbles: true }))

            expect(scope.onItemClicked).toHaveBeenCalledOnce()
            expect(vi.mocked(scope.onItemClicked).mock.calls[0][0]).toBe(SITES[1])
        })
    })

    it('redraws when the scope says so', () => {
        const scope = aList()
        ui = renderView(SubscriptionsView, scope)

        ui.act(() => {
            scope.sites = [{ id: 9, site: 'example.com' }]
            scope.forceUpdate()
        })

        expect(rows(ui)).toEqual(['example.com'])
    })
})
