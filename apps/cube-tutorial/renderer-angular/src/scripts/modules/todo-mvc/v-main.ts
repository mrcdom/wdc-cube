import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { bindScope, CubeViewSlot } from 'wdc-cube-angular'
import { MainScope } from 'wdc-cube-tutorial-presentation/todo-mvc'

@Component({
    selector: 'v-todo-main',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CubeViewSlot],
    template: `
        <section class="main">
            <ul class="todo-list">
                <ng-container *cubeViewSlot="scope().clock"></ng-container>
                @for (todo of scope().items; track todo.identity) {
                    <ng-container *cubeViewSlot="todo"></ng-container>
                }
            </ul>
        </section>
    `
})
export class TodoMainView {
    readonly scope = input.required<MainScope>()

    constructor() {
        bindScope(this.scope)
    }
}
