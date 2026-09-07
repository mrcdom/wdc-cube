import { Button } from '@spectrum-web-components/button'
import type { PropertyValues } from '@spectrum-web-components/base'
import { safeAction } from 'wdc-cube-webcomponents'

export type ActionButtonOptions = {
    /** What the button says. Also names the action in a failure report. */
    label: string

    /** What it does. Wrapped, so a throw is reported rather than lost. */
    onClick: () => unknown

    /** Overrides the name used in a failure report, when the label is not enough. */
    context?: string

    /** Spectrum's own treatments: the accent one is what a dialog wants pressed. */
    variant?: 'primary' | 'accent'
}

/**
 * A button that runs an action.
 *
 * `sp-button` extended rather than configured: the app pairs with a component
 * library the way the React and Angular ones do, and this is where that choice
 * is made — the views ask for a button and do not learn what it is made of.
 *
 * The listener is the reason this is a component and not four lines repeated at
 * each call site. It goes through `safeAction`, which is the part that must not
 * be forgettable: a throw inside a DOM event otherwise lands on `window`, where
 * nothing reports it.
 */
export class AppActionButton extends Button {
    /** What the button does. Assigned by whoever declares it. */
    public action: () => unknown = () => undefined

    /** Names the action in a failure report, when the label is not enough. */
    public context?: string

    public constructor() {
        super()

        // Nothing here may touch an attribute: a custom element constructor that
        // gains one cannot be upgraded, and a reflecting property is an
        // attribute. The variant is settled in the factory, where the default
        // that `ActionButtonOptions` documents is read.
        this.addEventListener('click', () =>
            safeAction(this.context ?? this.textContent?.trim() ?? 'action', () => this.action())
        )
    }

    protected override willUpdate(changed: PropertyValues): void {
        // In this application an accent button is the filled one and every other
        // is outlined, so the treatment follows the variant rather than being
        // stated again beside it.
        this.treatment = this.variant === 'accent' ? 'fill' : 'outline'
        super.willUpdate(changed)
    }
}

customElements.define('app-action-button', AppActionButton)

declare global {
    interface HTMLElementTagNameMap {
        'app-action-button': AppActionButton
    }
}
