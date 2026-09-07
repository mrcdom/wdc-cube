import type { AlertSeverity } from 'wdc-cube'

import { AlertScope } from 'wdc-cube-tutorial-core/main'

import '@spectrum-web-components/button-group/sp-button-group.js'
import '@spectrum-web-components/dialog/sp-dialog.js'

import { AppElement, type AppDom, type Icon, type IconName } from '../../widgets'
import Css from './main.module.scss'

/**
 * The icon and the colour per severity.
 *
 * Spectrum has an `sp-alert-dialog` that would carry this itself, but only for
 * the variants it names — confirmation, information, warning, error, destructive,
 * secondary. Success is not among them and is one of the four `AlertSeverity`
 * defines, so an `sp-dialog` with an icon of our own is what keeps all four
 * distinguishable. The colours are still Spectrum's own semantic tokens rather
 * than values written here.
 */
const SEVERITIES: Record<AlertSeverity, { icon: IconName; colour: string }> = {
    info: { icon: 'info', colour: 'var(--spectrum-informative-color-900)' },
    success: { icon: 'success', colour: 'var(--spectrum-positive-color-900)' },
    warning: { icon: 'warning', colour: 'var(--spectrum-notice-color-900)' },
    error: { icon: 'error', colour: 'var(--spectrum-negative-color-900)' }
}

export class AlertView extends AppElement<AlertScope> {
    private severityIcon!: Icon
    private headline!: HTMLSpanElement
    private supportingText!: HTMLParagraphElement

    protected declare(dom: AppDom): void {
        dom.element('sp-dialog', (dialog) => {
            dialog.size = 's'

            // sp-dialog lays a dialog out from its slots: the heading, then
            // whatever is unslotted as the content, then the buttons.
            dom.h2((heading) => {
                heading.slot = 'heading'
                heading.className = Css.dialogHeading
                this.severityIcon = dom.icon()
                this.headline = dom.span()
            })

            this.supportingText = dom.p((text) => (text.className = Css.dialogSupportingText))

            dom.element('sp-button-group', (buttons) => {
                buttons.slot = 'button'
                dom.actionButton({ label: 'Close', context: 'onClose', onClick: () => this.scope.onClose() })
            })
        })
    }

    protected override onUpdate(): void {
        const scope = this.scope
        const severity = SEVERITIES[scope.severity] ?? SEVERITIES.info

        this.severityIcon.setIcon(severity.icon)
        // Decided from the severity rather than from the colour: the token is a
        // long string and the severity already says whether it changed.
        this.setAttrByToken(this.severityIcon.host, 'style', scope.severity, `color: ${severity.colour}`)

        this.setText(this.headline, scope.title ?? '')
        this.setText(this.supportingText, scope.message ?? '')
    }
}
