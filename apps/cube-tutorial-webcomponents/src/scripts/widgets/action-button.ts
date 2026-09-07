import { Dom, safeAction } from 'wdc-cube-webcomponents'

import '@spectrum-web-components/button/sp-button.js'

export type ActionButtonOptions = {
    /** What the button says. Also names the action in a failure report. */
    label: string

    /** What it does. Wrapped, so a throw is reported rather than lost. */
    onClick: () => unknown

    /** Overrides the name used in a failure report, when the label is not enough. */
    context?: string

    /** Spectrum's own treatments: the accent one is what a dialog wants pressed. */
    variant?: 'primary' | 'accent' | 'quiet'
}

/**
 * A button that runs an action.
 *
 * An `<sp-button>` rather than a `<button>`: the app pairs with a component
 * library the way the React and Angular ones do, and the widget is where that
 * choice is made — the views ask for a button and do not learn what it is made
 * of. Swapping the library is a rewrite of this file, not of them.
 *
 * The listener still goes through `safeAction`, which is the part that must not
 * be forgettable: a throw inside a DOM event otherwise lands on `window`.
 */
export function actionButton(dom: Dom, options: ActionButtonOptions): HTMLElement {
    const button = document.createElement('sp-button')
    button.textContent = options.label

    const variant = options.variant ?? 'primary'
    button.setAttribute('variant', variant === 'accent' ? 'accent' : 'primary')
    if (variant === 'quiet') {
        button.setAttribute('treatment', 'outline')
        button.setAttribute('static-color', 'white')
    } else if (variant === 'primary') {
        button.setAttribute('treatment', 'outline')
    }

    button.addEventListener('click', () => safeAction(options.context ?? options.label, options.onClick))

    dom.append(button)
    return button
}
