import { type JSX } from 'solid-js'
import type { ViewProps } from 'wdc-cube-solid'
import { SubscriptionsDetailScope } from 'wdc-cube-tutorial-presentation/subscriptions'

import MainCss from '../main/main.module.scss'
import Css from './subscriptions.module.scss'

export function SubscriptionsDetailView(props: ViewProps<SubscriptionsDetailScope>): JSX.Element {
    return (
        <>
            <h2 class={MainCss.dialogHeading}>Subscribe</h2>
            <p class={MainCss.dialogText}>
                To subscribe to this website({props.scope.site}), please enter your email address here. We will send
                updates occasionally.
            </p>

            <div class={Css.emailField}>
                <label class={Css.emailLabel} for="subscribe-email">
                    Email Address
                </label>
                {/* Uncontrolled, as in the React and Angular views: the presenter
                    keeps the typed value to itself, without an update, so that
                    typing does not redraw the dialog. */}
                <input
                    id="subscribe-email"
                    type="email"
                    autofocus
                    onInput={(event) => props.scope.onEmailChanged(event.currentTarget.value)}
                />
            </div>

            <div class={MainCss.dialogActions}>
                <button class={MainCss.button} onClick={() => props.scope.onClose()}>
                    Cancel
                </button>
                <button class={MainCss.button} onClick={() => props.scope.onSubscribe()}>
                    Subscribe
                </button>
            </div>
        </>
    )
}
