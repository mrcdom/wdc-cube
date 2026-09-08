import { CubeViewSlot } from 'wdc-cube-webc'
import { TodoMvcScope } from 'wdc-cube-tutorial-core/todo-mvc'

import { AppElement, type AppDom } from '../../widgets'
import Css from './todo-mvc.module.scss'

export class TodoMvcView extends AppElement<TodoMvcScope> {
    private note!: HTMLParagraphElement
    private stressButton!: HTMLElement

    private headerSlot!: CubeViewSlot
    private mainSlot!: CubeViewSlot
    private footerSlot!: CubeViewSlot

    private readonly onToggleStress = this.action('onToggleStress', () => this.scope.actions.onToggleStress())

    protected declare(dom: AppDom): void {
        dom.div((view) => {
            view.className = Css.todoMvcView

            dom.div((body) => {
                body.className = Css.body

                dom.h1((title) => (title.textContent = 'todos'))

                dom.section((app) => {
                    app.className = Css.todoApp
                    this.headerSlot = new CubeViewSlot(dom.span())
                    this.mainSlot = new CubeViewSlot(dom.span())
                    this.footerSlot = new CubeViewSlot(dom.span())
                })

                dom.footer((info) => {
                    info.className = Css.info
                    this.note = dom.p()
                    this.stressButton = dom.actionButton((button) => {
                        button.className = Css.stressToggle
                        button.addEventListener('click', this.onToggleStress)
                    })
                })
            })
        })
    }

    protected override onUpdate(): void {
        const scope = this.scope

        this.headerSlot.setScope(scope.header)
        this.mainSlot.setScope(scope.main)
        this.footerSlot.setScope(scope.footer)

        this.setText(
            this.note,
            scope.stressMode
                ? 'Stress mode: 1000 generated items and a clock ticking every second.'
                : 'Showing a small sample list.'
        )
        this.setText(this.stressButton, scope.stressMode ? 'Back to the sample list' : 'Run the stress test')
    }

    protected override onRelease(): void {
        this.headerSlot.setScope(undefined)
        this.mainSlot.setScope(undefined)
        this.footerSlot.setScope(undefined)
    }
}
