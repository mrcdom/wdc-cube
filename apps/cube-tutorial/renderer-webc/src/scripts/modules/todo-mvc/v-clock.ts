import { ClockScope } from 'wdc-cube-tutorial-presentation/todo-mvc'

import { AppElement, type AppDom } from '../../widgets'

import Css from './todo-mvc.module.scss'

export class ClockView extends AppElement<ClockScope> {
    private time!: HTMLDivElement

    protected declare(dom: AppDom): void {
        dom.li((li) => {
            li.className = Css.clock
            this.time = dom.div()
        })
    }

    protected override onUpdate(): void {
        this.setText(this.time, this.scope.date.toLocaleTimeString())
    }
}
