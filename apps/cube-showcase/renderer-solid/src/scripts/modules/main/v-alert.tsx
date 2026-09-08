import { Button } from '@kobalte/core/button'
import { Dialog } from '@kobalte/core/dialog'
import { type JSX } from 'solid-js'
import type { AlertSeverity } from 'wdc-cube'
import type { ViewProps } from 'wdc-cube-solid'
import { AlertScope } from 'wdc-cube-showcase-presentation/main'

import Css from './main.module.scss'

const SEVERITIES: Record<AlertSeverity, { path: string; colour: string }> = {
    info: { path: 'M12 16v-4M12 8h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18', colour: Css.alertInfo },
    success: { path: 'm8 12 3 3 5-6M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18', colour: Css.alertSuccess },
    warning: {
        path: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0',
        colour: Css.alertWarning
    },
    error: { path: 'm15 9-6 6M9 9l6 6M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18', colour: Css.alertError }
}

export function AlertView(props: ViewProps<AlertScope>): JSX.Element {
    const severity = () => SEVERITIES[props.scope.severity] ?? SEVERITIES.info

    return (
        // The severity is one colour, set here and read by everything it tints.
        <div classList={{ [Css.alert]: true, [severity().colour]: true }}>
            <Dialog.Title class={Css.alertHeading}>
                <svg
                    class={Css.alertIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.9"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                >
                    <path d={severity().path} />
                </svg>
                {props.scope.title}
            </Dialog.Title>

            <Dialog.Description class={Css.alertMessage}>{props.scope.message}</Dialog.Description>

            <div class={Css.alertActions}>
                <Button class={Css.button} onClick={() => props.scope.onClose()}>
                    Close
                </Button>
            </div>
        </div>
    )
}
