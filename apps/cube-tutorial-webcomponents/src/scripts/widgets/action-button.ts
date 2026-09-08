import { Button } from '@spectrum-web-components/button'
import type { PropertyValues } from '@spectrum-web-components/base'

/**
 * The application's button.
 *
 * `sp-button` extended rather than configured: the app pairs with a component
 * library the way the React and Angular ones do, and this is where that choice
 * is made — the views ask for a button and do not learn what it is made of.
 *
 * It runs no action of its own. A button already reports being pressed, and a
 * view already declares its actions as guarded listeners, so wiring one is
 * `addEventListener('click', this.onClose)` like anywhere else.
 */
export class AppActionButton extends Button {
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
