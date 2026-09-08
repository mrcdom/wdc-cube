import { CubeViewSlot } from 'wdc-cube-webc'

import { SpectrumDom } from './SpectrumDom'

import styles from './modal-layer.scss?inline'

const SHEET = new CSSStyleSheet()
SHEET.replaceSync(styles)

/**
 * A scrim with something centred over it, and a slot for whoever fills it.
 *
 * The shell declares this twice, identically but for one class, and the part
 * that is easy to leave out is the `stopPropagation`: without it a click on the
 * panel reaches the scrim behind and dismisses what the user was reaching for.
 *
 * Whatever the slot draws stays in the light DOM — a view is only slotted into
 * the surface, never moved inside this shadow root, so the application's own
 * stylesheets go on reaching it.
 *
 * Clicking beside the panel is reported as a `dismiss` event rather than run
 * through a callback the layer holds: what to do about it is the shell's, and
 * the shell already has a guarded listener to hand.
 */
export class AppModalLayer extends HTMLElement {
    /** What draws whatever scope is in the layer. */
    public readonly viewSlot: CubeViewSlot

    public constructor() {
        super()

        const root = this.attachShadow({ mode: 'open' })
        root.adoptedStyleSheets = [SHEET]

        SpectrumDom.render(root, (dom) => {
            dom.spUnderlay((underlay) => (underlay.open = true))

            dom.div((surface) => {
                surface.className = 'surface'
                // Without this a click inside the panel reaches the scrim and
                // dismisses the very thing being clicked. Slotted content is
                // part of this subtree once flattened, so the listener sees it.
                surface.addEventListener('click', (event) => event.stopPropagation())
                dom.append(document.createElement('slot'))
            })
        })

        this.addEventListener('click', () => this.dispatchEvent(new CustomEvent('dismiss')))

        this.viewSlot = new CubeViewSlot(this)

        // Not hidden here: a custom element constructor may not gain an
        // attribute, and `hidden` is one. The shell hides it in the update that
        // follows its own `declare`, in the same task, so it is never painted.
    }
}

customElements.define('app-modal-layer', AppModalLayer)

declare global {
    interface HTMLElementTagNameMap {
        'app-modal-layer': AppModalLayer
    }
}
