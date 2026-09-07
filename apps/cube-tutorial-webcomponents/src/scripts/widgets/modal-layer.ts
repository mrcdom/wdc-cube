import { CubeViewSlot, Dom, safeAction } from 'wdc-cube-webcomponents'

import '@spectrum-web-components/underlay/sp-underlay.js'

import Css from './widgets.module.scss'

export type ModalLayer = {
    /** The layer. Shown and hidden by the view that owns it. */
    readonly host: HTMLElement

    /** What draws whatever scope is in the layer. */
    readonly slot: CubeViewSlot
}

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
 * The scrim is Spectrum's `sp-underlay`, so it dims with the colour and the
 * opacity the rest of the system uses. It is `position: fixed` on its own, which
 * is why it does not enclose the panel: the layer around both is what centres
 * one over the other.
 *
 * The shell declares this twice, identically but for one class, and the part
 * that is easy to leave out is the `stopPropagation`: without it a click on the
 * panel reaches the scrim behind and dismisses what the user was reaching for.
 */
export function modalLayer(dom: Dom, options: ModalLayerOptions): ModalLayer {
    let slot!: CubeViewSlot

    const host = dom.div((layer) => {
        layer.className = options.className ? `${Css.modalLayer} ${options.className}` : Css.modalLayer
        layer.hidden = true

        dom.element('sp-underlay', (underlay) => (underlay.open = true))

        // Everything the layer holds is dismissed by clicking beside it, so the
        // listener goes on the layer rather than on the scrim it covers.
        layer.addEventListener('click', () => safeAction(options.context, options.onDismiss))

        slot = new CubeViewSlot(
            dom.div((surface) => {
                surface.className = Css.modalSurface
                surface.addEventListener('click', (event) => event.stopPropagation())
            })
        )
    })

    return { host, slot }
}
