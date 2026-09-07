import { afterEach, describe, expect, it, vi } from 'vitest'
import { SubscriptionsScope, type SiteItemType } from 'wdc-cube-tutorial-core/subscriptions'

import { Rendered } from '../../../test/render'
import { SubscriptionsView } from './v-subscriptions'

let ui: Rendered | undefined

afterEach(() => {
    ui?.unmount()
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

const rows = (ui: Rendered) => ui.all('li').map((li) => li.textContent)

describe('SubscriptionsView', () => {
    describe('drawing the scope', () => {
        it('lists a row per site, in the order given', () => {
            ui = new Rendered().render(<SubscriptionsView scope={aList()} />)

            expect(rows(ui)).toEqual(['youtube.com', 'twitter.com', 'gettr.com'])
        })

        it('draws nothing but the heading for an empty list', () => {
            ui = new Rendered().render(<SubscriptionsView scope={aList([])} />)

            expect(rows(ui)).toEqual([])
            expect(ui.text('h1')).toEqual('Sites you can subscribe to...')
        })

        it('names the list for a screen reader', () => {
            ui = new Rendered().render(<SubscriptionsView scope={aList()} />)

            expect(ui.get('nav').getAttribute('aria-label')).toEqual('Sites you can subscribe to')
        })
    })

    describe('firing actions', () => {
        it('reports the site that was clicked, not just its position', () => {
            const scope = aList()
            ui = new Rendered().render(<SubscriptionsView scope={scope} />)

            const twitter = ui.all('li [role="button"]')[1]
            ui.act(() => twitter.dispatchEvent(new MouseEvent('click', { bubbles: true })))

            expect(scope.onItemClicked).toHaveBeenCalledOnce()
            expect(vi.mocked(scope.onItemClicked).mock.calls[0][0]).toBe(SITES[1])
        })
    })

    it('redraws when the scope says so', () => {
        const scope = aList()
        ui = new Rendered().render(<SubscriptionsView scope={scope} />)

        ui.act(() => {
            scope.sites = [{ id: 9, site: 'example.com' }]
            scope.forceUpdate()
        })

        expect(rows(ui)).toEqual(['example.com'])
    })
})
