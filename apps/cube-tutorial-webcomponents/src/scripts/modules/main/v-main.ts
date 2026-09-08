import { CubeViewSlot } from 'wdc-cube-webcomponents'
import { MainScope } from 'wdc-cube-tutorial-core/main'

import { AppElement, type AppDom, type AppModalLayer } from '../../widgets'
import Css from './main.module.scss'

/** The application shell: a bar, a body slot, and the two modal layers. */
export class MainView extends AppElement<MainScope> {
    private bodySlot!: CubeViewSlot

    private dialogLayer!: AppModalLayer
    private alertLayer!: AppModalLayer

    protected declare(dom: AppDom): void {
        dom.div((view) => {
            view.className = Css.mainView

            dom.div((bar) => {
                bar.className = Css.appBar

                dom.span((title) => {
                    title.className = Css.appBarTitle
                    title.textContent = 'Cube Framework (Tutorial Example)'
                })

                // sp-top-nav marks the current item itself, from `selects` and
                // the value of the item that was clicked; the presenter is what
                // decides where the click goes.
                dom.spTopNav((nav) => {
                    nav.quiet = true
                    this.navItem(dom, 'Home', () => this.scope.onHome())
                    this.navItem(dom, 'Todos', () => this.scope.onOpenTodos())
                    this.navItem(dom, 'Subscriptions', () => this.scope.onOpenSuscriptions())
                    this.navItem(dom, 'Login', () => this.scope.onLogin())
                })
            })

            this.bodySlot = new CubeViewSlot(dom.div((body) => (body.className = Css.body)))

            this.dialogLayer = dom.modalLayer((layer) => {
                layer.context = 'closeDialog'
                layer.onDismiss = () => this.scope.dialog?.onClose()
            })

            // Above the dialog, so an alert raised from inside one dims it.
            this.alertLayer = dom.modalLayer((layer) => {
                layer.className = Css.alertLayer
                layer.context = 'closeAlert'
                layer.onDismiss = () => this.scope.alert?.onClose()
            })
        })
    }

    private navItem(dom: AppDom, label: string, action: () => unknown): void {
        dom.spTopNavItem((item) => {
            item.textContent = label
            // No href: this is not a link, it is an action the presenter answers.
            item.addEventListener('click', () => this.safeAction(`nav:${label}`, action))
        })
    }

    protected override onUpdate(): void {
        const scope = this.scope

        this.bodySlot.setScope(scope.body)

        this.dialogLayer.viewSlot.setScope(scope.dialog)
        this.setVisible(this.dialogLayer, !!scope.dialog)

        this.alertLayer.viewSlot.setScope(scope.alert)
        this.setVisible(this.alertLayer, !!scope.alert)
    }

    protected override onRelease(): void {
        this.bodySlot.setScope(undefined)
        this.dialogLayer.viewSlot.setScope(undefined)
        this.alertLayer.viewSlot.setScope(undefined)
    }
}
