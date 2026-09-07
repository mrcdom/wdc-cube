import type { Dom } from 'wdc-cube-webcomponents'

import styles from './panel.scss?inline'

const SHEET = new CSSStyleSheet()
SHEET.replaceSync(styles)

export type PanelOptions = {
    /** The heading text. */
    heading: string

    /** Which heading element it is. Defaults to `h3`. */
    headingTag?: 'h1' | 'h3'

    /** Declares whatever goes under the heading. */
    content?: (dom: Dom) => void
}

/**
 * A bordered card with a heading.
 *
 * The home body and the subscriptions list were the same four CSS rules written
 * twice under different names, which is the kind of duplication that only shows
 * up when one of them is changed.
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
