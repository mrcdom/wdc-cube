import { CubeElement, CubeViewSlot, Dom, SyncedRows } from 'wdc-cube-webcomponents'
import { ItemScope, MainScope } from 'wdc-cube-tutorial-core/todo-mvc'

import Css from './todo-mvc.module.scss'
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
    private clockSlot!: CubeViewSlot

    // The scope is its own identity: the presenter builds an ItemScope once and
    // keeps it, so a row that already had this todo keeps it — and keeps the
    // editor that may be open in it — even when the list around it changes.
    private readonly items = new SyncedRows<ItemScope, ItemView>({
        key: (scope) => scope,
        create: () => new ItemView()
    })

    protected declare(dom: Dom): void {
        dom.section((section) => {
            section.className = Css.main
            this.list = dom.ul((ul) => {
                ul.className = Css.todoList
                this.clockSlot = new CubeViewSlot(dom.span())
            })
        })
    }

    protected override onUpdate(): void {
        this.clockSlot.setScope(this.scope.clock)

        this.items.sync(
            this.list,
            this.scope.items.map((item) => item)
        )
    }

    protected override onRelease(): void {
        this.clockSlot.setScope(undefined)
        this.items.clear()
    }
}
