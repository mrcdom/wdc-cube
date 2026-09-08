import { afterEach, describe, expect, it, vi } from 'vitest'
import { ViewFactory } from 'wdc-cube-webc'
import { SubscriptionsScope, type SiteItemType } from 'wdc-cube-tutorial-presentation/subscriptions'

import { renderView, type Rendered } from '../../../test/render'
import { registerViews } from './index'

registerViews(ViewFactory.define)

let ui: Rendered<SubscriptionsScope> | undefined

afterEach(() => {
    ui?.unmount()
    ui = undefined
})

function sites(...names: string[]): SiteItemType[] {
    return names.map((site, index) => ({ id: index + 1, site }) as SiteItemType)
}

function aList(items: SiteItemType[] = sites('youtube.com', 'twitter.com')) {
    const scope = new SubscriptionsScope()
    scope.sites = items
    scope.onItemClicked = vi.fn()
    return scope
}

/** What a reader sees, which for a Spectrum sidenav item is its label. */
const labels = (rendered: Rendered<SubscriptionsScope>) =>
    rendered.all('sp-sidenav-item').map((row) => row.getAttribute('label'))

describe('SubscriptionsView', () => {
    it('lists a row per site, in the order given', () => {
        ui = renderView('v-subscriptions', aList(sites('a.com', 'b.com', 'c.com')))

        expect(labels(ui)).toEqual(['a.com', 'b.com', 'c.com'])
    })

    it('draws nothing but the heading for an empty list', () => {
        ui = renderView('v-subscriptions', aList([]))

        expect(ui.all('sp-sidenav-item')).toHaveLength(0)
        expect(ui.text('h1')).toEqual('Sites you can subscribe to...')
    })

    it('names the list for a screen reader', () => {
        ui = renderView('v-subscriptions', aList())

        expect(ui.get('sp-sidenav').getAttribute('aria-label')).toEqual('Sites you can subscribe to')
    })

    it('reports the site that was clicked, not just its position', () => {
        const items = sites('youtube.com', 'twitter.com')
        const scope = aList(items)
        ui = renderView('v-subscriptions', scope)

        ui.click('sp-sidenav-item[value="2"]')

        expect(scope.onItemClicked).toHaveBeenCalledWith(items[1])
    })

    it('redraws when the scope says so', () => {
        const scope = aList(sites('youtube.com'))
        ui = renderView('v-subscriptions', scope)

        ui.act(() => {
            scope.sites = sites('youtube.com', 'gettr.com')
            scope.forceUpdate()
        })

        expect(labels(ui)).toEqual(['youtube.com', 'gettr.com'])
    })

    /**
     * `SyncedRows` matches by key, so a row whose site is still in the list keeps
     * its node. Reusing rows by position would read the same and quietly move
     * whatever a row was holding onto the wrong site.
     */
    describe('keeping rows', () => {
        it('builds only the row that is new', () => {
            const scope = aList(sites('youtube.com', 'twitter.com'))
            ui = renderView('v-subscriptions', scope)

            const before = ui.all('sp-sidenav-item')
            ui.act(() => {
                scope.sites = sites('youtube.com', 'twitter.com', 'gettr.com')
                scope.forceUpdate()
            })

            const after = ui.all('sp-sidenav-item')
            expect(after).toHaveLength(3)
            expect(after[0]).toBe(before[0])
            expect(after[1]).toBe(before[1])
        })

        it('keeps a row on its own site when one before it is removed', () => {
            const scope = aList(sites('youtube.com', 'twitter.com', 'gettr.com'))
            ui = renderView('v-subscriptions', scope)

            const gettr = ui.all('sp-sidenav-item')[2]
            ui.act(() => {
                // The service hands back fresh objects for the same sites, which
                // is why the key is the id and not the object.
                scope.sites = [
                    { id: 1, site: 'youtube.com' } as SiteItemType,
                    { id: 3, site: 'gettr.com' } as SiteItemType
                ]
                scope.forceUpdate()
            })

            const after = ui.all('sp-sidenav-item')
            expect(labels(ui)).toEqual(['youtube.com', 'gettr.com'])
            expect(after[1]).toBe(gettr)
        })
    })
})
