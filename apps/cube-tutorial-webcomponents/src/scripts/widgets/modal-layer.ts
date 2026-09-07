import { CubeViewSlot, Dom, safeAction } from 'wdc-cube-webcomponents'

import Css from './widgets.module.scss'

export type ModalLayer = {
    /** The scrim. Shown and hidden by the view that owns it. */
    readonly backdrop: HTMLElement

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
 * A scrim with a panel in it, and a slot for whoever fills the panel.
 *
 * The shell declared this twice, identically but for one class, and the part
 * that is easy to leave out is the last line: without it a click on the panel
 * reaches the scrim behind and dismisses what the user was reaching for.
 */
export function modalLayer(dom: Dom, options: ModalLayerOptions): ModalLayer {
    let slot!: CubeViewSlot

    const backdrop = dom.div((element) => {
        element.className = options.className ? `${Css.backdrop} ${options.className}` : Css.backdrop
        element.hidden = true
        element.addEventListener('click', () => safeAction(options.context, options.onDismiss))

        slot = new CubeViewSlot(
            dom.div((surface) => {
                surface.className = Css.panelSurface
                // Without this a click inside the panel reaches the scrim and
                // dismisses the very thing being clicked.
                surface.addEventListener('click', (event) => event.stopPropagation())
            })
        )
    })

    return { backdrop, slot }
}
