import { SubscriptionsDetailScope } from 'wdc-cube-tutorial-core/subscriptions'

import '@spectrum-web-components/field-label/sp-field-label.js'
import '@spectrum-web-components/textfield/sp-textfield.js'

import { AppElement, type AppDom } from '../../widgets'
import MainCss from '../main/main.module.scss'
import Css from './subscriptions.module.scss'

/** A Spectrum field: an element with a value, whose own input is in shadow DOM. */
type Field = HTMLElement & { value: string }

export class SubscriptionsDetailView extends AppElement<SubscriptionsDetailScope> {
    private blurb!: HTMLParagraphElement
    private field!: Field

    protected declare(dom: AppDom): void {
        dom.h3((title) => {
            title.className = MainCss.dialogTitle
            title.textContent = 'Subscribe'
        })

        dom.div((content) => {
            content.className = MainCss.dialogContent
            this.blurb = dom.p()

            dom.div((group) => {
                group.className = Css.emailField

                const label = dom.append(document.createElement('sp-field-label'))
                label.setAttribute('for', 'subscribe-email')
                label.textContent = 'Email Address'

                this.field = dom.append(document.createElement('sp-textfield')) as Field
                this.field.id = 'subscribe-email'
                this.field.setAttribute('type', 'email')
                this.field.addEventListener('input', () => this.scope.onEmailChanged(this.field.value))
            })
        })

        dom.div((actions) => {
            actions.className = MainCss.dialogActions
            dom.actionButton({ label: 'Cancel', context: 'onClose', onClick: () => this.scope.onClose() })
            dom.actionButton({
                label: 'Subscribe',
                context: 'onSubscribe',
                variant: 'accent',
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

        // The same guard as everywhere else, but against the host's own value:
        // an sp-textfield keeps its <input> in shadow DOM, so setValue cannot
        // reach it and there is nothing to compare on this side.
        const wanted = this.scope.email ?? ''
        if (this.field.value !== wanted) {
            this.field.value = wanted
        }
    }
}
