import type { AlertSeverity } from 'wdc-cube'

import { AlertScope } from 'wdc-cube-tutorial-presentation/main'

import { AppElement, type AppAlertDialog, type AppAlertDialogVariant, type AppDom } from '../../widgets'

/**
 * The four severities the core raises, in the component's own vocabulary.
 *
 * Three of them are Spectrum's; success is the one `AppAlertDialog` adds. What
 * each looks like — the icon and its colour — belongs to the component now, so
 * nothing about the appearance of an alert is decided here.
 */
const VARIANTS: Record<AlertSeverity, AppAlertDialogVariant> = {
    info: 'information',
    success: 'success',
    warning: 'warning',
    error: 'error'
}

export class AlertView extends AppElement<AlertScope> {
    private dialog!: AppAlertDialog
    private headline!: HTMLHeadingElement
    private supportingText!: HTMLParagraphElement

    private readonly onClose = this.action('onClose', () => this.scope.onClose())

    protected declare(dom: AppDom): void {
        this.dialog = dom.alertDialog(() => {
            this.headline = dom.h2((heading) => (heading.slot = 'heading'))
            this.supportingText = dom.p()

            // The dialog wraps this in an sp-button-group of its own.
            dom.actionButton((button) => {
                button.slot = 'button'
                button.textContent = 'Close'
                button.addEventListener('click', this.onClose)
            })
        })
    }

    protected override onUpdate(): void {
        const scope = this.scope

        // No guard of ours: the setter is the component's, and it already leaves
        // early when the variant has not moved.
        this.dialog.variant = VARIANTS[scope.severity] ?? 'information'

        this.setText(this.headline, scope.title ?? '')
        this.setText(this.supportingText, scope.message ?? '')
    }
}
