import type { AlertSeverity } from 'wdc-cube'

import { BodyScope } from 'wdc-cube-tutorial-core/main'

import { AppElement, type AppDom } from '../../widgets'
import Css from './main.module.scss'

const SEVERITIES: AlertSeverity[] = ['info', 'success', 'warning', 'error']

export class BodyView extends AppElement<BodyScope> {
    protected declare(dom: AppDom): void {
        dom.panel({
            heading: 'Alert examples',
            content: () => {
                dom.div((pane) => {
                    pane.className = Css.buttonPane
                    for (const severity of SEVERITIES) {
                        dom.actionButton({
                            label: severity,
                            context: `onOpenAlert:${severity}`,
                            onClick: () => this.scope.onOpenAlert(severity)
                        })
                    }
                })
            }
        })
    }
}
