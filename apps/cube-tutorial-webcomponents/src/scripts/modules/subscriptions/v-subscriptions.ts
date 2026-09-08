import { SyncedRows } from 'wdc-cube-webcomponents'
import type { SideNav, SideNavItem } from '@spectrum-web-components/sidenav'

import { SubscriptionsScope, type SiteItemType } from 'wdc-cube-tutorial-core/subscriptions'

import { AppDom, AppElement } from '../../widgets'

export class SubscriptionsView extends AppElement<SubscriptionsScope> {
    private list!: SideNav

    /**
     * A site is data, not a scope, so it is not its own identity across updates —
     * the service could hand back a fresh object for the same site. The id is,
     * which is what keeps a row on the site it was showing.
     */
    private readonly sites = new SyncedRows<SiteItemType, SideNavItem>({
        key: (site) => site.id,
        create: () => this.newRow(),
        assign: (row, site) => {
            // The listener reads the site off the row, so replacing the data does
            // not mean replacing the handler. `value` is the item's own identity
            // field, which is what sp-sidenav selects on.
            this.setAttr(row, 'value', String(site.id))
            this.setAttr(row, 'label', site.site)
        }
    })

    /**
     * A factory rather than a field: the action needs the row it was put on.
     *
     * The row, not the site — `assign` hands the same row a different site as
     * the list changes, so what the listener reads has to be read when it runs.
     */
    private readonly onItemClicked = (row: SideNavItem) =>
        this.action('onItemClicked', () => {
            const id = Number(row.value)
            const site = this.scope.sites.find((candidate) => candidate.id === id)
            if (site) {
                this.scope.onItemClicked(site)
            }
        })

    protected declare(dom: AppDom): void {
        dom.panel(() => {
            dom.h1((heading) => (heading.textContent = 'Sites you can subscribe to...'))

            this.list = dom.spSidenav((list) => list.setAttribute('aria-label', 'Sites you can subscribe to'))
        })
    }

    protected override onUpdate(): void {
        this.sites.sync(this.list, this.scope.sites)
    }

    protected override onRelease(): void {
        this.sites.clear()
    }

    private newRow(): SideNavItem {
        let row!: SideNavItem

        AppDom.render(this.list, (dom) => {
            row = dom.spSidenavItem()

            // Per item rather than on the sidenav's `change`: opening the same
            // site twice in a row is an ordinary thing to do, and `change` only
            // fires when the selection actually moves.
            row.addEventListener('click', this.onItemClicked(row))
        })

        return row
    }
}
