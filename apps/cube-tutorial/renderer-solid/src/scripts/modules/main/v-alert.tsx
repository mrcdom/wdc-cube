import { Button } from '@kobalte/core/button'
import { Dialog } from '@kobalte/core/dialog'
import { type JSX } from 'solid-js'
import type { AlertSeverity } from 'wdc-cube'
import type { ViewProps } from 'wdc-cube-solid'
import { AlertScope } from 'wdc-cube-tutorial-presentation/main'

import Css from './main.module.scss'

/** The icon path and the colour class per severity, looked up rather than searched. */
const SEVERITIES: Record<AlertSeverity, { path: string; colour: string }> = {
    info: {
        path: 'M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2',
        colour: Css.alertInfo
    },
    success: {
        path: 'm10 17-5-5 1.41-1.42L10 14.17l7.59-7.59L19 8m-7-6A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2',
        colour: Css.alertSuccess
    },
    warning: { path: 'M13 14h-2V9h2m0 9h-2v-2h2M1 21h22L12 2z', colour: Css.alertWarning },
    error: {
        path: 'M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2',
        colour: Css.alertError
    }
}

export function AlertView(props: ViewProps<AlertScope>): JSX.Element {
    const severity = () => SEVERITIES[props.scope.severity] ?? SEVERITIES.info

    return (
        // The severity is one colour, set here and read by everything it tints,
        // rather than four rules that have to be kept in step.
        <div classList={{ [Css.alert]: true, [severity().colour]: true }}>
            {/* Title and Description rather than h2 and p: the dialog around
                this points its `aria-labelledby` and `aria-describedby` at
                whatever fills them, and it is the dialog that has to say so. */}
            <Dialog.Title class={Css.alertHeading}>
                <svg class={Css.alertIcon} viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="currentColor" d={severity().path} />
                </svg>
                {props.scope.title}
            </Dialog.Title>

            <Dialog.Description class={Css.alertMessage}>{props.scope.message}</Dialog.Description>

            <div class={Css.alertActions}>
                <Button class={Css.buttonQuiet} onClick={() => props.scope.onClose()}>
                    Close
                </Button>
            </div>
        </div>
    )
}
