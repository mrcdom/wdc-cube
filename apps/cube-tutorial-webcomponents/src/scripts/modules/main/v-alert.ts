import { CubeElement, Dom } from 'wdc-cube-webcomponents'
import { AlertScope } from 'wdc-cube-tutorial-core/main'

export class AlertView extends CubeElement<AlertScope> {
    private alert!: HTMLDivElement
    private titleText!: HTMLElement
    private message!: HTMLParagraphElement

    protected declare(dom: Dom): void {
        this.alert = dom.div((box) => {
            box.className = 'alert'
            box.setAttribute('role', 'alert')

            this.titleText = dom.strong((strong) => (strong.className = 'alert-title'))
            this.message = dom.p()
        })

        dom.div((actions) => {
            actions.className = 'dialog-actions'
            dom.button((button) => {
                button.textContent = 'Close'
                button.addEventListener('click', () => this.safeAction('onClose', () => this.scope.onClose()))
            })
        })
    }

    protected override onUpdate(): void {
        const scope = this.scope

        for (const severity of ['info', 'success', 'warning', 'error']) {
            this.setClass(this.alert, `alert-${severity}`, severity === scope.severity)
        }

        this.setText(this.titleText, scope.title ?? '')
        this.setText(this.message, scope.message ?? '')
    }
}
