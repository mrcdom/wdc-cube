import { Button } from '@kobalte/core/button'
import { For, type JSX } from 'solid-js'
import type { AlertSeverity } from 'wdc-cube'
import type { ViewProps } from 'wdc-cube-solid'
import { BodyScope } from 'wdc-cube-tutorial-presentation/main'

import Css from './main.module.scss'

const SEVERITIES: AlertSeverity[] = ['info', 'success', 'warning', 'error']

export function BodyView(props: ViewProps<BodyScope>): JSX.Element {
    return (
        <div class={Css.panel}>
            <h3 class={Css.panelHeading}>Alert examples</h3>
            <div class={Css.buttonPane}>
                <For each={SEVERITIES}>
                    {(severity) => (
                        <Button class={Css.button} onClick={() => props.scope.onOpenAlert(severity)}>
                            {severity}
                        </Button>
                    )}
                </For>
            </div>
        </div>
    )
}
