import { CubeElement, Dom, SyncedRows } from 'wdc-cube-webcomponents'
import { SubscriptionsScope, type SiteItemType } from 'wdc-cube-tutorial-core/subscriptions'

import Css from './subscriptions.module.scss'

export class SubscriptionsView extends CubeElement<SubscriptionsScope> {
    private list!: HTMLUListElement

    /**
     * A site is data, not a scope, so it is not its own identity across updates —
     * the service could hand back a fresh object for the same site. The id is,
     * which is what keeps a row on the site it was showing.
     */
    private readonly sites = new SyncedRows<SiteItemType, HTMLLIElement>({
        key: (site) => site.id,
        create: () => this.newRow(),
        assign: (row, site) => {
            const button = row.firstElementChild as HTMLButtonElement
            // The listener reads the site off the row, so replacing the data does
            // not mean replacing the handler.
            row.dataset.siteId = String(site.id)
            this.setText(button, site.site)
        }
    })

    protected declare(dom: Dom): void {
        dom.div((view) => {
            view.className = Css.subscriptionsView
            dom.h1((heading) => (heading.textContent = 'Sites you can subscribe to...'))
            this.list = dom.ul((list) => list.setAttribute('aria-label', 'Sites you can subscribe to'))
        })
    }

    protected override onUpdate(): void {
        this.sites.sync(this.list, this.scope.sites)
    }

    protected override onRelease(): void {
        this.sites.clear()
    }

    private newRow(): HTMLLIElement {
        let row!: HTMLLIElement

        Dom.render(this.list, (dom) => {
            row = dom.li(() => {
                dom.button((button) => {
                    button.addEventListener('click', () =>
                        this.safeAction('onItemClicked', () => {
                            const id = Number(row.dataset.siteId)
                            const site = this.scope.sites.find((candidate) => candidate.id === id)
                            if (site) {
                                this.scope.onItemClicked(site)
                            }
                        })
                    )
                })
            })
        })

        return row
    }
}
