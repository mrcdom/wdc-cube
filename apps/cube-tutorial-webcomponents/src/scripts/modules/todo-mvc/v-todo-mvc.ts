import { CubeElement, CubeViewSlot, Dom } from 'wdc-cube-webcomponents'
import { TodoMvcScope } from 'wdc-cube-tutorial-core/todo-mvc'

import { actionButton } from '../../widgets'
import Css from './todo-mvc.module.scss'

export class TodoMvcView extends CubeElement<TodoMvcScope> {
    private note!: HTMLParagraphElement
    private stressButton!: HTMLButtonElement

    private headerSlot!: CubeViewSlot
    private mainSlot!: CubeViewSlot
    private footerSlot!: CubeViewSlot

    protected declare(dom: Dom): void {
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
                    this.stressButton = actionButton(dom, {
                        label: '',
                        context: 'onToggleStress',
                        variant: 'bare',
                        onClick: () => this.scope.actions.onToggleStress()
                    })
                    this.stressButton.className = Css.stressToggle
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
