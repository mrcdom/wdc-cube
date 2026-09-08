import type { AlertSeverity } from 'wdc-cube'

import { BodyScope } from 'wdc-cube-tutorial-app/main'

import { AppElement, type AppDom } from '../../widgets'
import Css from './main.module.scss'

const SEVERITIES: AlertSeverity[] = ['info', 'success', 'warning', 'error']

export class BodyView extends AppElement<BodyScope> {
    // A factory rather than a field: which alert to raise is decided as the
    // button is declared, and there are four of them.
    private readonly onOpenAlert = (severity: AlertSeverity) =>
        this.action(`onOpenAlert:${severity}`, () => this.scope.onOpenAlert(severity))

    protected declare(dom: AppDom): void {
        dom.panel(() => {
            dom.h3((heading) => (heading.textContent = 'Alert examples'))

            dom.div((pane) => {
                pane.className = Css.buttonPane
                for (const severity of SEVERITIES) {
                    dom.actionButton((button) => {
                        button.textContent = severity
                        button.addEventListener('click', this.onOpenAlert(severity))
                    })
                }
            })
        })
    }
}
