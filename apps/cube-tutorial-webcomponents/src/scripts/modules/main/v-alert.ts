import type { AlertSeverity } from 'wdc-cube'
import { CubeElement, Dom } from 'wdc-cube-webcomponents'
import { AlertScope } from 'wdc-cube-tutorial-core/main'

import { actionButton } from '../../widgets'
import Css from './main.module.scss'

/**
 * The icon per severity, and the class that colours it.
 *
 * Material 3 has no coloured banner inside a dialog: a basic dialog is an
 * optional icon, a headline, supporting text and the actions. The severity is
 * what the icon says, which is why each one is a different shape rather than the
 * same shape in a different colour.
 *
 * Drawn here rather than pulled from an icon font, so the app keeps its promise
 * of having no view dependency at all.
 */
const SEVERITIES: Record<AlertSeverity, { path: string; className: string }> = {
    info: {
        path: 'M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
        className: Css.alertInfo
    },
    success: {
        path: 'M12 2a10 10 0 100 20 10 10 0 000-20zm-2 15l-5-5 1.4-1.4L10 14.2l7.6-7.6L19 8l-9 9z',
        className: Css.alertSuccess
    },
    warning: {
        path: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
        className: Css.alertWarning
    },
    error: {
        path: 'M12 2a10 10 0 100 20 10 10 0 000-20zm5 13.6L15.6 17 12 13.4 8.4 17 7 15.6 10.6 12 7 8.4 8.4 7 12 10.6 15.6 7 17 8.4 13.4 12 17 15.6z',
        className: Css.alertError
    }
}

const SVG_NS = 'http://www.w3.org/2000/svg'

export class AlertView extends CubeElement<AlertScope> {
    private icon!: SVGSVGElement
    private iconPath!: SVGPathElement
    private headline!: HTMLHeadingElement
    private supportingText!: HTMLParagraphElement

    protected declare(dom: Dom): void {
        dom.div((header) => {
            header.className = Css.dialogHeader
            this.icon = this.declareIcon(header)
            this.headline = dom.h3((heading) => (heading.className = Css.dialogHeadline))
        })

        this.supportingText = dom.p((text) => (text.className = Css.dialogSupportingText))

        dom.div((actions) => {
            actions.className = Css.dialogActions
            actionButton(dom, { label: 'Close', context: 'onClose', onClick: () => this.scope.onClose() })
        })
    }

    protected override onUpdate(): void {
        const scope = this.scope
        const severity = SEVERITIES[scope.severity] ?? SEVERITIES.info

        this.setAttr(this.iconPath, 'd', severity.path)
        // The class comes from the same lookup as the path, rather than from
        // toggling each of the four in turn. `class` and not `className`: on an
        // SVG element that property is an SVGAnimatedString, not a string.
        this.setAttr(this.icon, 'class', `${Css.dialogIcon} ${severity.className}`)

        this.setText(this.headline, scope.title ?? '')
        this.setText(this.supportingText, scope.message ?? '')
    }

    /**
     * Dom builds HTML elements; an SVG needs its own namespace, so this one is
     * assembled by hand and appended to the element that holds it.
     */
    private declareIcon(host: HTMLElement): SVGSVGElement {
        const svg = document.createElementNS(SVG_NS, 'svg')
        svg.setAttribute('viewBox', '0 0 24 24')
        svg.setAttribute('aria-hidden', 'true')

        this.iconPath = document.createElementNS(SVG_NS, 'path')
        this.iconPath.setAttribute('fill', 'currentColor')
        svg.appendChild(this.iconPath)

        host.appendChild(svg)
        return svg
    }
}
