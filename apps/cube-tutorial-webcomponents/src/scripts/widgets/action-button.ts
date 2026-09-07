import { Dom, safeAction } from 'wdc-cube-webcomponents'

import Css from './widgets.module.scss'

export type ActionButtonOptions = {
    /** What the button says. Also names the action in a failure report.  */
    label: string

    /** What it does. Wrapped, so a throw is reported rather than lost. */
    onClick: () => unknown

    /** Overrides the name used in a failure report, when the label is not enough. */
    context?: string

    /** `bare` reads as a label; `primary` is the one action a dialog wants pressed. */
    variant?: 'default' | 'primary' | 'bare'
}

/**
 * A button that runs an action.
 *
 * Every button in the app was the same three lines — create, set the text, add a
 * listener wrapped in `safeAction` — and forgetting the wrapper is silent until
 * something throws inside a DOM event and lands on `window` instead of in the
 * log. Here it cannot be forgotten.
 */
export function actionButton(dom: Dom, options: ActionButtonOptions): HTMLButtonElement {
    return dom.button((button) => {
        button.textContent = options.label
        button.className = classFor(options.variant)
        button.addEventListener('click', () => safeAction(options.context ?? options.label, options.onClick))
    })
}

function classFor(variant: ActionButtonOptions['variant']): string {
    switch (variant) {
        case 'primary':
            return `${Css.button} ${Css.buttonPrimary}`
        case 'bare':
            return Css.buttonBare
        default:
            return Css.button
    }
}
