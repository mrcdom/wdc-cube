import { afterEach, describe, expect, it, vi } from 'vitest'
import { SubscriptionsScope, type SiteItemType } from 'wdc-cube-tutorial-presentation/subscriptions'

import { Rendered } from '../../../test/render'
import { SubscriptionsView } from './v-subscriptions'

let ui: Rendered | undefined

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

describe('SubscriptionsView', () => {
    it('lists a row per site, in the order given', () => {
        ui = new Rendered().render(() => <SubscriptionsView scope={aList(sites('a.com', 'b.com', 'c.com'))} />)

        expect(ui.all('li button').map((b) => b.textContent)).toEqual(['a.com', 'b.com', 'c.com'])
    })

    it('draws nothing but the heading for an empty list', () => {
        ui = new Rendered().render(() => <SubscriptionsView scope={aList([])} />)

        expect(ui.all('li')).toHaveLength(0)
        expect(ui.text('h1')).toEqual('Sites you can subscribe to...')
    })

    it('names the list for a screen reader', () => {
        ui = new Rendered().render(() => <SubscriptionsView scope={aList()} />)

        expect(ui.get('ul').getAttribute('aria-label')).toEqual('Sites you can subscribe to')
    })

    it('reports the site that was clicked, not just its position', () => {
        const items = sites('youtube.com', 'twitter.com')
        const scope = aList(items)
        ui = new Rendered().render(() => <SubscriptionsView scope={scope} />)

        ui.click('li:nth-child(2) button')

        expect(scope.onItemClicked).toHaveBeenCalledWith(items[1])
    })

    it('redraws when the scope says so', () => {
        const scope = aList(sites('youtube.com'))
        ui = new Rendered().render(() => <SubscriptionsView scope={scope} />)

        ui.act(() => {
            scope.sites = sites('youtube.com', 'gettr.com')
            scope.forceUpdate()
        })

        expect(ui.all('li button').map((b) => b.textContent)).toEqual(['youtube.com', 'gettr.com'])
    })

    it('keeps the rows it already had when the list grows', () => {
        const first = sites('youtube.com', 'twitter.com')
        const scope = aList(first)
        ui = new Rendered().render(() => <SubscriptionsView scope={scope} />)

        const rows = ui.all('li')
        // `<For>` keys on the item's own reference, so the two that stayed are
        // the same nodes and only the new one is built.
        ui.act(() => (scope.sites = [...first, { id: 3, site: 'gettr.com' } as SiteItemType]))

        const after = ui.all('li')
        expect(after).toHaveLength(3)
        expect(after[0]).toBe(rows[0])
        expect(after[1]).toBe(rows[1])
    })
})
