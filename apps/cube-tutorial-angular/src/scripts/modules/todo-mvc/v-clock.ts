import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { bindScope } from 'wdc-cube-angular'
import { ClockScope } from 'wdc-cube-tutorial-core/todo-mvc'

@Component({
    selector: 'v-clock',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './todo-mvc.scss',
    template: `<li class="clock">
        <div>{{ scope().date.toLocaleTimeString() }}</div>
    </li>`
})
export class ClockView {
    readonly scope = input.required<ClockScope>()

    constructor() {
        bindScope(this.scope)
    }
}
