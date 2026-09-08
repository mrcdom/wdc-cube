import { CubeViewSlot, SyncedRows } from 'wdc-cube-webc'
import { ItemScope, MainScope } from 'wdc-cube-tutorial-core/todo-mvc'

import { AppElement, type AppDom } from '../../widgets'

import Css from './todo-mvc.module.scss'
import { ItemView } from './v-item'

/**
 * The list.
 *
 * `syncList` is what this view is about: the presenter hands it a list of item
 * scopes and it keeps one element per scope, reusing what is already there —
 * which is what an open editor in row three depends on.
 */
export class TodoMainView extends AppElement<MainScope> {
    private list!: HTMLUListElement
    private clockSlot!: CubeViewSlot

    // The presenter says what a row stands for; this only reads it. Keying on
    // the instance would work today and would quietly stop working the day the
    // presenter rebuilt a scope for the same todo.
    private readonly items = new SyncedRows<ItemScope, ItemView>({
        key: (scope) => scope.identity,
        create: () => new ItemView()
    })

    protected declare(dom: AppDom): void {
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
