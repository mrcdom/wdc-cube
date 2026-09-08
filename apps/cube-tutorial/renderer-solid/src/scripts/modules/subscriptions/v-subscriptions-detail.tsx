import { Button } from '@kobalte/core/button'
import { Dialog } from '@kobalte/core/dialog'
import { TextField } from '@kobalte/core/text-field'
import { type JSX } from 'solid-js'
import type { ViewProps } from 'wdc-cube-solid'
import { SubscriptionsDetailScope } from 'wdc-cube-tutorial-presentation/subscriptions'

import MainCss from '../main/main.module.scss'
import Css from './subscriptions.module.scss'

export function SubscriptionsDetailView(props: ViewProps<SubscriptionsDetailScope>): JSX.Element {
    return (
        <>
            <Dialog.Title class={MainCss.dialogHeading}>Subscribe</Dialog.Title>

            <Dialog.Description class={MainCss.dialogText}>
                To subscribe to this website({props.scope.site}), please enter your email address here. We will send
                updates occasionally.
            </Dialog.Description>

            {/* TextField ties the label to the input itself, so neither has to
                carry an id invented here and kept in step by hand.

                Uncontrolled, as in the React and Angular views: the presenter
                keeps the typed value to itself, without an update, so that
                typing does not redraw the dialog. */}
            <TextField class={Css.emailField} onChange={(value) => props.scope.onEmailChanged(value)}>
                <TextField.Label class={Css.emailLabel}>Email Address</TextField.Label>
                <TextField.Input type="email" autofocus />
            </TextField>

            <div class={MainCss.dialogActions}>
                <Button class={MainCss.button} onClick={() => props.scope.onClose()}>
                    Cancel
                </Button>
                <Button class={MainCss.button} onClick={() => props.scope.onSubscribe()}>
                    Subscribe
                </Button>
            </div>
        </>
    )
}
