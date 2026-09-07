import { Dom } from 'wdc-cube-webcomponents'

import Css from './widgets.module.scss'

const SVG_NS = 'http://www.w3.org/2000/svg'

export type Icon = {
    /** The `<svg>`, whose `class` carries whatever colours it. */
    readonly element: SVGSVGElement

    /** The `<path>`, whose `d` is the shape being drawn. */
    readonly path: SVGPathElement
}

/**
 * A 24×24 icon drawn from path data.
 *
 * Drawn rather than pulled from an icon font, because this app carries no view
 * dependency at all and an icon font would be one. It fills with `currentColor`,
 * so whatever colours the element colours the icon.
 *
 * Both halves come back, and the caller changes them: an icon that varies does
 * so through the same guarded setters as everything else, rather than through a
 * second way of writing to the DOM hidden in here.
 */
export function icon(dom: Dom, path?: string): Icon {
    const element = document.createElementNS(SVG_NS, 'svg')
    element.setAttribute('viewBox', '0 0 24 24')
    element.setAttribute('aria-hidden', 'true')
    element.setAttribute('class', Css.icon)

    const shape = document.createElementNS(SVG_NS, 'path')
    shape.setAttribute('fill', 'currentColor')
    if (path) {
        shape.setAttribute('d', path)
    }
    element.appendChild(shape)

    dom.append(element)

    return { element, path: shape }
}
