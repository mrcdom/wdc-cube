import { Dom } from 'wdc-cube-webcomponents'

import '@spectrum-web-components/icons-workflow/icons/sp-icon-info.js'
import '@spectrum-web-components/icons-workflow/icons/sp-icon-checkmark-circle.js'
import '@spectrum-web-components/icons-workflow/icons/sp-icon-alert.js'
import '@spectrum-web-components/icons-workflow/icons/sp-icon-close-circle.js'

/** The workflow icons this application draws on, by the name a view asks for. */
export const ICONS = {
    info: 'sp-icon-info',
    success: 'sp-icon-checkmark-circle',
    warning: 'sp-icon-alert',
    error: 'sp-icon-close-circle'
} as const

export type IconName = keyof typeof ICONS

/**
 * One of Spectrum's workflow icons.
 *
 * Each is its own element, so changing which icon is shown means swapping the
 * element rather than rewriting a path — which is why this hands back the host
 * it was placed in, and `setIcon` does the swap.
 */
export type Icon = {
    /** The element the icon lives inside. Swapping does not disturb it. */
    readonly host: HTMLElement

    /** Shows `name`, replacing whatever was there. Does nothing if unchanged. */
    setIcon(name: IconName): void
}

export function icon(dom: Dom, name?: IconName): Icon {
    const host = dom.span((element) => {
        element.setAttribute('aria-hidden', 'true')
    })

    let current: IconName | undefined

    const setIcon = (next: IconName) => {
        if (next === current) {
            return
        }
        current = next
        host.replaceChildren(document.createElement(ICONS[next]))
    }

    if (name) {
        setIcon(name)
    }

    return { host, setIcon }
}
