import type { Textfield } from '@spectrum-web-components/textfield'

import { SubscriptionsDetailScope } from 'wdc-cube-tutorial-core/subscriptions'

import { AppElement, type AppDom } from '../../widgets'
import Css from './subscriptions.module.scss'

export class SubscriptionsDetailView extends AppElement<SubscriptionsDetailScope> {
    private blurb!: HTMLParagraphElement
    private field!: Textfield

    private readonly onEmailChanged = this.action('onEmailChanged', () => this.scope.onEmailChanged(this.field.value))
    private readonly onClose = this.action('onClose', () => this.scope.onClose())
    private readonly onSubscribe = this.action('onSubscribe', () => this.scope.onSubscribe())

    protected declare(dom: AppDom): void {
        dom.spDialog((dialog) => {
            dialog.size = 's'

            dom.h2((heading) => {
                heading.slot = 'heading'
                heading.textContent = 'Subscribe'
            })

            this.blurb = dom.p()

            dom.div((group) => {
                group.className = Css.emailField

                dom.spFieldLabel((label) => {
                    label.setAttribute('for', 'subscribe-email')
                    label.textContent = 'Email Address'
                })

                this.field = dom.spTextfield((field) => {
                    field.id = 'subscribe-email'
                    field.type = 'email'
                    field.addEventListener('input', this.onEmailChanged)
                })
            })

            dom.spButtonGroup((buttons) => {
                buttons.slot = 'button'

                dom.actionButton((button) => {
                    button.textContent = 'Cancel'
                    button.addEventListener('click', this.onClose)
                })

                dom.actionButton((button) => {
                    button.textContent = 'Subscribe'
                    button.variant = 'accent'
                    button.addEventListener('click', this.onSubscribe)
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
