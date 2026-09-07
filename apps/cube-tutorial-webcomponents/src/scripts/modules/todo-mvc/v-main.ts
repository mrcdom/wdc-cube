import { CubeElement, CubeViewSlot, Dom } from 'wdc-cube-webcomponents'
import { ItemScope, MainScope } from 'wdc-cube-tutorial-core/todo-mvc'

import { ItemView } from './v-item'

/**
 * The list.
 *
 * `syncList` is what this view is about: the presenter hands it a list of item
 * scopes and it keeps one element per scope, reusing what is already there —
 * which is what an open editor in row three depends on.
 */
export class TodoMainView extends CubeElement<MainScope> {
    private list!: HTMLUListElement
    private clockHost!: HTMLElement
    private clockSlot?: CubeViewSlot

    private readonly rows: ItemView[] = []

    protected declare(dom: Dom): void {
        dom.section((section) => {
            section.className = 'main'
            this.list = dom.ul((ul) => {
                ul.className = 'todo-list'
                this.clockHost = dom.span()
            })
        })
    }

    protected override onUpdate(): void {
        this.clockSlot ??= new CubeViewSlot(this.clockHost)
        this.clockSlot.setScope(this.scope.clock)

        this.syncList<ItemScope, ItemView>(
            this.list,
            this.scope.items.map((item) => item),
            this.rows,
            () => new ItemView()
        )
    }

    protected override onRelease(): void {
        this.clockSlot?.setScope(undefined)
        this.rows.length = 0
    }
}
