import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { bindScope, CubeViewSlot } from 'wdc-cube-angular'
import { TodoMvcScope } from 'wdc-cube-tutorial-core/todo-mvc'

@Component({
    selector: 'v-todo-mvc',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CubeViewSlot],
    styleUrl: './todo-mvc.scss',
    template: `
        <div class="todo-mvc-view">
            <div class="body">
                <h1>todos</h1>
                <div class="todo-app">
                    <ng-container *cubeViewSlot="scope().header"></ng-container>
                    <ng-container *cubeViewSlot="scope().main"></ng-container>
                    <ng-container *cubeViewSlot="scope().footer"></ng-container>
                </div>

                <footer class="info">
                    <p>
                        {{
                            scope().stressMode
                                ? 'Stress mode: 1000 generated items and a clock ticking every second.'
                                : 'Showing a small sample list.'
                        }}
                    </p>
                    <button type="button" class="stress-toggle" (click)="scope().actions.onToggleStress()">
                        {{ scope().stressMode ? 'Back to the sample list' : 'Run the stress test' }}
                    </button>
                </footer>
            </div>
        </div>
    `
})
export class TodoMvcView {
    readonly scope = input.required<TodoMvcScope>()

    constructor() {
        bindScope(this.scope)
    }
}
