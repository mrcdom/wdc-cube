import { CubeElement, CubeViewSlot, Dom } from 'wdc-cube-webcomponents'
import { MainScope } from 'wdc-cube-tutorial-core/main'

import { actionButton, modalLayer } from '../../widgets'
import Css from './main.module.scss'

/** The application shell: a bar, a body slot, and the two modal layers. */
export class MainView extends CubeElement<MainScope> {
    private bodySlot!: CubeViewSlot

    private dialogBackdrop!: HTMLElement
    private dialogSlot!: CubeViewSlot

    private alertBackdrop!: HTMLElement
    private alertSlot!: CubeViewSlot

    protected declare(dom: Dom): void {
        dom.div((view) => {
            view.className = Css.mainView

            dom.nav((bar) => {
                bar.className = Css.appBar

                dom.span((title) => {
                    title.className = Css.appBarTitle
                    title.textContent = 'Cube Framework (Tutorial Example)'
                })

                this.navButton(dom, 'Home', () => this.scope.onHome())
                this.navButton(dom, 'Todos', () => this.scope.onOpenTodos())
                this.navButton(dom, 'Subscriptions', () => this.scope.onOpenSuscriptions())
                this.navButton(dom, 'Login', () => this.scope.onLogin())
            })

            this.bodySlot = new CubeViewSlot(dom.div((body) => (body.className = Css.body)))

            const dialog = modalLayer(dom, {
                context: 'closeDialog',
                onDismiss: () => this.scope.dialog?.onClose()
            })
            this.dialogBackdrop = dialog.backdrop
            this.dialogSlot = dialog.slot

            // Above the dialog, so an alert raised from inside one dims it.
            const alert = modalLayer(dom, {
                context: 'closeAlert',
                onDismiss: () => this.scope.alert?.onClose(),
                className: Css.alertBackdrop
            })
            this.alertBackdrop = alert.backdrop
            this.alertSlot = alert.slot
        })
    }

    private navButton(dom: Dom, label: string, action: () => unknown): void {
        actionButton(dom, { label, onClick: action, context: `nav:${label}`, variant: 'bare' })
    }

    protected override onUpdate(): void {
        const scope = this.scope

        this.bodySlot.setScope(scope.body)

        this.dialogSlot.setScope(scope.dialog)
        this.setVisible(this.dialogBackdrop, !!scope.dialog)

        this.alertSlot.setScope(scope.alert)
        this.setVisible(this.alertBackdrop, !!scope.alert)
    }

    protected override onRelease(): void {
        this.bodySlot.setScope(undefined)
        this.dialogSlot.setScope(undefined)
        this.alertSlot.setScope(undefined)
    }
}
