import styles from './panel.scss?inline'

const SHEET = new CSSStyleSheet()
SHEET.replaceSync(styles)

/**
 * A bordered card with a heading.
 *
 * The home body and the subscriptions list were the same four CSS rules written
 * twice under different names, which is the kind of duplication that only shows
 * up when one of them is changed.
 *
 * The heading is declared like any other child, so the panel does not have to
 * decide what level it is: a page's card heads an h1, one inside a page an h3.
 *
 * The host is the card, so nothing is wrapped around what the caller declares;
 * the styles are in a shadow root, so they cannot reach anything but this, and
 * what the caller puts inside stays in the light DOM where the rest of the
 * application's stylesheets can still see it.
 */
export class AppPanel extends HTMLElement {
    public constructor() {
        super()

        const root = this.attachShadow({ mode: 'open' })
        root.adoptedStyleSheets = [SHEET]
        root.appendChild(document.createElement('slot'))
    }
}

customElements.define('app-panel', AppPanel)

declare global {
    interface HTMLElementTagNameMap {
        'app-panel': AppPanel
    }
}
