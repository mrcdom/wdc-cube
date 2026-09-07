import { CubeElement, CubeViewSlot, Dom } from 'wdc-cube-webcomponents'
import { TodoMvcScope } from 'wdc-cube-tutorial-core/todo-mvc'

export class TodoMvcView extends CubeElement<TodoMvcScope> {
    private headerHost!: HTMLElement
    private mainHost!: HTMLElement
    private footerHost!: HTMLElement
    private note!: HTMLParagraphElement
    private stressButton!: HTMLButtonElement

    private headerSlot?: CubeViewSlot
    private mainSlot?: CubeViewSlot
    private footerSlot?: CubeViewSlot

    protected declare(dom: Dom): void {
        dom.div((view) => {
            view.className = 'todo-mvc-view'

            dom.div((body) => {
                body.className = 'body'

                dom.h1((title) => (title.textContent = 'todos'))

                dom.section((app) => {
                    app.className = 'todo-app'
                    this.headerHost = dom.span()
                    this.mainHost = dom.span()
                    this.footerHost = dom.span()
                })

                dom.footer((info) => {
                    info.className = 'info'
                    this.note = dom.p()
                    this.stressButton = dom.button((button) => {
                        button.className = 'stress-toggle'
                        button.addEventListener('click', () =>
                            this.safeAction('onToggleStress', () => this.scope.actions.onToggleStress())
                        )
                    })
                })
            })
        })
    }

    protected override onUpdate(): void {
        const scope = this.scope

        this.headerSlot ??= new CubeViewSlot(this.headerHost)
        this.mainSlot ??= new CubeViewSlot(this.mainHost)
        this.footerSlot ??= new CubeViewSlot(this.footerHost)

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
        this.headerSlot?.setScope(undefined)
        this.mainSlot?.setScope(undefined)
        this.footerSlot?.setScope(undefined)
    }
}
