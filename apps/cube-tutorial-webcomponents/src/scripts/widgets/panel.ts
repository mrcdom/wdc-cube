import { Dom } from 'wdc-cube-webcomponents'

import Css from './widgets.module.scss'

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
 */
export function panel(dom: Dom, options: PanelOptions): HTMLDivElement {
    return dom.div((card) => {
        card.className = Css.panel

        dom.element(options.headingTag ?? 'h3', (heading) => {
            heading.className = Css.panelHeading
            heading.textContent = options.heading
        })

        options.content?.(dom)
    })
}
