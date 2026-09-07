import { SubscriptionsDetailScope } from 'wdc-cube-tutorial-core/subscriptions'

import { AppElement, type AppDom } from '../../widgets'
import MainCss from '../main/main.module.scss'
import Css from './subscriptions.module.scss'

export class SubscriptionsDetailView extends AppElement<SubscriptionsDetailScope> {
    private blurb!: HTMLParagraphElement
    private field!: HTMLInputElement

    protected declare(dom: AppDom): void {
        dom.h3((title) => {
            title.className = MainCss.dialogTitle
            title.textContent = 'Subscribe'
        })

        dom.div((content) => {
            content.className = MainCss.dialogContent
            this.blurb = dom.p()

            dom.label((label) => {
                label.className = Css.emailField
                dom.span((caption) => (caption.textContent = 'Email Address'))
                this.field = dom.input((input) => {
                    input.type = 'email'
                    input.addEventListener('input', () => this.scope.onEmailChanged(input.value))
                })
            })
        })

        dom.div((actions) => {
            actions.className = MainCss.dialogActions
            dom.actionButton({ label: 'Cancel', context: 'onClose', onClick: () => this.scope.onClose() })
            dom.actionButton({
                label: 'Subscribe',
                context: 'onSubscribe',
                variant: 'primary',
                onClick: () => this.scope.onSubscribe()
            })
        })
    }

    protected override onUpdate(): void {
        this.setText(
            this.blurb,
            `To subscribe to this website(${this.scope.site ?? ''}), please enter your email address here. ` +
                'We will send updates occasionally.'
        )
        this.setValue(this.field, this.scope.email ?? '')
    }
}
