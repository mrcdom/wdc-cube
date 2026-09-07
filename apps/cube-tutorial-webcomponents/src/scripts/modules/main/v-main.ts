import { CubeElement, CubeViewSlot, Dom } from 'wdc-cube-webcomponents'
import { MainScope } from 'wdc-cube-tutorial-core/main'

/** The application shell: a bar, a body slot, and the two modal layers. */
export class MainView extends CubeElement<MainScope> {
    private bodyHost!: HTMLElement
    private bodySlot?: CubeViewSlot

    private dialogBackdrop!: HTMLElement
    private dialogHost!: HTMLElement
    private dialogSlot?: CubeViewSlot

    private alertBackdrop!: HTMLElement
    private alertHost!: HTMLElement
    private alertSlot?: CubeViewSlot

    protected declare(dom: Dom): void {
        dom.div((view) => {
            view.className = 'main-view'

            dom.nav((bar) => {
                bar.className = 'app-bar'

                dom.span((title) => {
                    title.className = 'app-bar-title'
                    title.textContent = 'Cube Framework (Tutorial Example)'
                })

                this.navButton(dom, 'Home', () => this.scope.onHome())
                this.navButton(dom, 'Todos', () => this.scope.onOpenTodos())
                this.navButton(dom, 'Subscriptions', () => this.scope.onOpenSuscriptions())
                this.navButton(dom, 'Login', () => this.scope.onLogin())
            })

            this.bodyHost = dom.div((body) => (body.className = 'body'))

            this.dialogBackdrop = dom.div((backdrop) => {
                backdrop.className = 'backdrop'
                backdrop.hidden = true
                backdrop.addEventListener('click', () =>
                    this.safeAction('closeDialog', () => this.scope.dialog?.onClose())
                )
                this.dialogHost = dom.div((panel) => {
                    panel.className = 'dialog'
                    // Clicking the panel must not reach the backdrop behind it.
                    panel.addEventListener('click', (event) => event.stopPropagation())
                })
            })

            this.alertBackdrop = dom.div((backdrop) => {
                backdrop.className = 'backdrop alert-backdrop'
                backdrop.hidden = true
                backdrop.addEventListener('click', () =>
                    this.safeAction('closeAlert', () => this.scope.alert?.onClose())
                )
                this.alertHost = dom.div((panel) => {
                    panel.className = 'dialog alert-dialog'
                    panel.addEventListener('click', (event) => event.stopPropagation())
                })
            })
        })
    }

    private navButton(dom: Dom, label: string, action: () => unknown): void {
        dom.button((button) => {
            button.textContent = label
            button.addEventListener('click', () => this.safeAction(`nav:${label}`, action))
        })
    }

    protected override onUpdate(): void {
        const scope = this.scope

        this.bodySlot ??= new CubeViewSlot(this.bodyHost)
        this.bodySlot.setScope(scope.body)

        this.dialogSlot ??= new CubeViewSlot(this.dialogHost)
        this.dialogSlot.setScope(scope.dialog)
        this.setVisible(this.dialogBackdrop, !!scope.dialog)

        this.alertSlot ??= new CubeViewSlot(this.alertHost)
        this.alertSlot.setScope(scope.alert)
        this.setVisible(this.alertBackdrop, !!scope.alert)
    }

    protected override onRelease(): void {
        this.bodySlot?.setScope(undefined)
        this.dialogSlot?.setScope(undefined)
        this.alertSlot?.setScope(undefined)
    }
}
