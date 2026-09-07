import { CubeViewSlot, Dom, safeAction } from 'wdc-cube-webcomponents'

import '@spectrum-web-components/underlay/sp-underlay.js'

import styles from './modal-layer.scss?inline'

const SHEET = new CSSStyleSheet()
SHEET.replaceSync(styles)

export type ModalLayerOptions = {
    /** Names the dismissal in a failure report. */
    context: string

    /** What clicking outside the panel does. */
    onDismiss: () => unknown

    /** Stacks this layer above another. A dialog can raise an alert over itself. */
    className?: string
}

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
 */
export class AppModalLayer extends HTMLElement {
    /** What draws whatever scope is in the layer. */
    public readonly viewSlot: CubeViewSlot

    /** Names the dismissal in a failure report. */
    public context = 'dismiss'

    /** What clicking outside the panel does. */
    public onDismiss: () => unknown = () => undefined

    public constructor() {
        super()

        const root = this.attachShadow({ mode: 'open' })
        root.adoptedStyleSheets = [SHEET]

        Dom.render(root, (dom) => {
            dom.element('sp-underlay', (underlay) => (underlay.open = true))

            dom.div((surface) => {
                surface.className = 'surface'
                // Without this a click inside the panel reaches the scrim and
                // dismisses the very thing being clicked. Slotted content is
                // part of this subtree once flattened, so the listener sees it.
                surface.addEventListener('click', (event) => event.stopPropagation())
                dom.append(document.createElement('slot'))
            })
        })

        this.addEventListener('click', () => safeAction(this.context, () => this.onDismiss()))

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
