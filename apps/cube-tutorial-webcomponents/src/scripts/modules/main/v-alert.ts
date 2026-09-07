import type { AlertSeverity } from 'wdc-cube'
import { CubeElement, Dom } from 'wdc-cube-webcomponents'
import { AlertScope } from 'wdc-cube-tutorial-core/main'

import { actionButton } from '../../widgets'
import Css from './main.module.scss'

/**
 * The class per severity, spelled out.
 *
 * With CSS modules the name in the sheet is not the name in the DOM, so
 * `alert-${severity}` cannot be built by hand any more — which is the point of
 * modules, and the map is what replaces the concatenation.
 */
const SEVERITY_CLASS: Record<AlertSeverity, string> = {
    info: Css.alertInfo,
    success: Css.alertSuccess,
    warning: Css.alertWarning,
    error: Css.alertError
}

export class AlertView extends CubeElement<AlertScope> {
    private alert!: HTMLDivElement
    private titleText!: HTMLElement
    private message!: HTMLParagraphElement

    protected declare(dom: Dom): void {
        this.alert = dom.div((box) => {
            box.className = Css.alert
            box.setAttribute('role', 'alert')

            this.titleText = dom.strong((strong) => (strong.className = Css.alertTitle))
            this.message = dom.p()
        })

        dom.div((actions) => {
            actions.className = Css.dialogActions
            actionButton(dom, { label: 'Close', context: 'onClose', onClick: () => this.scope.onClose() })
        })
    }

    protected override onUpdate(): void {
        const scope = this.scope

        for (const [severity, className] of Object.entries(SEVERITY_CLASS)) {
            this.setClass(this.alert, className, severity === scope.severity)
        }

        this.setText(this.titleText, scope.title ?? '')
        this.setText(this.message, scope.message ?? '')
    }
}
