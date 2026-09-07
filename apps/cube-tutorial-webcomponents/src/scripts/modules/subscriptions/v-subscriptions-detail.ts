import { CubeElement, Dom } from 'wdc-cube-webcomponents'
import { SubscriptionsDetailScope } from 'wdc-cube-tutorial-core/subscriptions'

export class SubscriptionsDetailView extends CubeElement<SubscriptionsDetailScope> {
    private field!: HTMLInputElement

    protected declare(dom: Dom): void {
        dom.h3((title) => {
            title.className = 'dialog-title'
            title.textContent = 'Subscribe'
        })

        dom.div((content) => {
            content.className = 'dialog-content'
            dom.p(
                (text) =>
                    (text.textContent =
                        'To subscribe to this website, please enter your email address here. ' +
                        'We will send updates occasionally.')
            )

            dom.label((label) => {
                label.className = 'email-field'
                dom.span((caption) => (caption.textContent = 'Email Address'))
                this.field = dom.input((input) => {
                    input.type = 'email'
                    input.addEventListener('input', () => this.scope.onEmailChanged(input.value))
                })
            })
        })

        dom.div((actions) => {
            actions.className = 'dialog-actions'
            dom.button((button) => {
                button.textContent = 'Cancel'
                button.addEventListener('click', () => this.safeAction('onClose', () => this.scope.onClose()))
            })
            dom.button((button) => {
                button.className = 'primary'
                button.textContent = 'Subscribe'
                button.addEventListener('click', () => this.safeAction('onSubscribe', () => this.scope.onSubscribe()))
            })
        })
    }

    protected override onUpdate(): void {
        this.setValue(this.field, this.scope.email ?? '')
    }
}
