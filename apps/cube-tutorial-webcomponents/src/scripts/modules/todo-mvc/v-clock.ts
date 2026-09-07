import { CubeElement, Dom } from 'wdc-cube-webcomponents'
import { ClockScope } from 'wdc-cube-tutorial-core/todo-mvc'

export class ClockView extends CubeElement<ClockScope> {
    private time!: HTMLDivElement

    protected declare(dom: Dom): void {
        dom.li((li) => {
            li.className = 'clock'
            this.time = dom.div()
        })
    }

    protected override onUpdate(): void {
        this.setText(this.time, this.scope.date.toLocaleTimeString())
    }
}
