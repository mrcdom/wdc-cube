import { Button } from '@spectrum-web-components/button'
import type { PropertyValues } from '@spectrum-web-components/base'
import { safeAction } from 'wdc-cube-webcomponents'

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

        this.addEventListener('click', () =>
            safeAction(this.context ?? this.textContent?.trim() ?? 'action', () => this.action())
        )
    }

    public override connectedCallback(): void {
        super.connectedCallback()

        // Spectrum's default is accent, which is a page's one emphasised button;
        // most of the buttons here are not that one.
        //
        // Not in the constructor: an element that gains an attribute there can
        // never be upgraded, and `variant` reflects to one — the page fails to
        // build with `NotSupportedError` and nothing says which line did it.
        // Declaring appends before it configures, so a call site that chooses a
        // variant does so after this and wins.
        if (!this.hasAttribute('variant')) {
            this.variant = 'primary'
        }
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
