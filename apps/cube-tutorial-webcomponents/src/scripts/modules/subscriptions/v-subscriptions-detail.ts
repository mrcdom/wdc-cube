import { SubscriptionsDetailScope } from 'wdc-cube-tutorial-core/subscriptions'

import '@spectrum-web-components/button-group/sp-button-group.js'
import '@spectrum-web-components/dialog/sp-dialog.js'
import '@spectrum-web-components/field-label/sp-field-label.js'
import '@spectrum-web-components/textfield/sp-textfield.js'

import { AppElement, type AppDom } from '../../widgets'
import Css from './subscriptions.module.scss'

export class SubscriptionsDetailView extends AppElement<SubscriptionsDetailScope> {
    private blurb!: HTMLParagraphElement
    private field!: HTMLElementTagNameMap['sp-textfield']

    protected declare(dom: AppDom): void {
        dom.element('sp-dialog', (dialog) => {
            dialog.size = 's'

            dom.h2((heading) => {
                heading.slot = 'heading'
                heading.textContent = 'Subscribe'
            })

            this.blurb = dom.p()

            dom.div((group) => {
                group.className = Css.emailField

                dom.element('sp-field-label', (label) => {
                    label.setAttribute('for', 'subscribe-email')
                    label.textContent = 'Email Address'
                })

                this.field = dom.element('sp-textfield', (field) => {
                    field.id = 'subscribe-email'
                    field.type = 'email'
                    field.addEventListener('input', () => this.scope.onEmailChanged(this.field.value))
                })
            })

            dom.element('sp-button-group', (buttons) => {
                buttons.slot = 'button'
                dom.actionButton({ label: 'Cancel', context: 'onClose', onClick: () => this.scope.onClose() })
                dom.actionButton({
                    label: 'Subscribe',
                    context: 'onSubscribe',
                    variant: 'accent',
                    onClick: () => this.scope.onSubscribe()
                })
            })
        })
    }

    protected override onUpdate(): void {
        this.setText(
            this.blurb,
            `To subscribe to this website(${this.scope.site ?? ''}), please enter your email address here. ` +
                'We will send updates occasionally.'
        )

        // The field is not written here, and `scope.email` is not read.
        //
        // The presenter takes the typed value in `onEmailChanged` and keeps it
        // to itself, without an update — deliberately, so that typing does not
        // redraw the dialog. `scope.email` therefore stays undefined however
        // much has been typed, and writing it back turned every update into a
        // reset: raising the alert that says the address is wrong emptied the
        // field the reader was about to correct. The React and Angular views
        // leave their inputs uncontrolled for the same reason.
    }
}
