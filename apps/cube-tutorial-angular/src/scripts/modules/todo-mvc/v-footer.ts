import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { bindScope } from 'wdc-cube-angular'
import { FooterScope, ShowingOptions } from 'wdc-cube-tutorial-core/todo-mvc'

@Component({
    selector: 'v-footer',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <footer class="footer">
            <span class="todo-count">
                <strong>{{ scope().count }}</strong> {{ scope().activeTodoWord }} left
            </span>
            <ul class="filters">
                <li>
                    <a [class.selected]="scope().showing === Showing.ALL" (click)="scope().actions.onShowAll()">All</a>
                </li>
                <li>
                    <a [class.selected]="scope().showing === Showing.ACTIVE" (click)="scope().actions.onShowActives()">
                        Active
                    </a>
                </li>
                <li>
                    <a
                        [class.selected]="scope().showing === Showing.COMPLETED"
                        (click)="scope().actions.onShowCompleteds()"
                    >
                        Completed
                    </a>
                </li>
            </ul>
            @if (scope().clearButtonVisible) {
                <button type="button" class="clear-completed" (click)="scope().actions.onClearCompleted()">
                    Clear completed
                </button>
            }
        </footer>
    `
})
export class FooterView {
    readonly scope = input.required<FooterScope>()

    readonly Showing = ShowingOptions

    constructor() {
        bindScope(this.scope)
    }
}
