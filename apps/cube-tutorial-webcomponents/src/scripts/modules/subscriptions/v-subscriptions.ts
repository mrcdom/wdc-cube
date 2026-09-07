import { CubeElement, Dom } from 'wdc-cube-webcomponents'
import { SubscriptionsScope, type SiteItemType } from 'wdc-cube-tutorial-core/subscriptions'

import Css from './subscriptions.module.scss'

export class SubscriptionsView extends CubeElement<SubscriptionsScope> {
    private list!: HTMLUListElement
    private rows: { item: SiteItemType; element: HTMLLIElement; label: HTMLElement }[] = []

    protected declare(dom: Dom): void {
        dom.div((view) => {
            view.className = Css.subscriptionsView
            dom.h1((heading) => (heading.textContent = 'Sites you can subscribe to...'))
            this.list = dom.ul((list) => list.setAttribute('aria-label', 'Sites you can subscribe to'))
        })
    }

    protected override onUpdate(): void {
        const sites = this.scope.sites

        // Same shape as syncList, by hand: these rows are not views of their own,
        // because a site is not a scope.
        for (let index = this.rows.length - 1; index >= sites.length; index--) {
            const [row] = this.rows.splice(index, 1)
            row.element.remove()
        }

        while (this.rows.length < sites.length) {
            const row = this.addRow()
            this.rows.push(row)
        }

        for (let index = 0; index < sites.length; index++) {
            const row = this.rows[index]
            row.item = sites[index]
            this.setText(row.label, row.item.site)
        }
    }

    private addRow() {
        const row = { item: undefined as unknown as SiteItemType, element: null!, label: null! } as {
            item: SiteItemType
            element: HTMLLIElement
            label: HTMLElement
        }

        Dom.render(this.list, (dom) => {
            row.element = dom.li(() => {
                row.label = dom.button((button) => {
                    button.addEventListener('click', () =>
                        this.safeAction('onItemClicked', () => this.scope.onItemClicked(row.item))
                    )
                })
            })
        })

        return row
    }
}
