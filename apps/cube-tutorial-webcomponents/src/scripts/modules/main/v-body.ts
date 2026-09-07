import type { AlertSeverity } from 'wdc-cube'
import { CubeElement, Dom } from 'wdc-cube-webcomponents'
import { BodyScope } from 'wdc-cube-tutorial-core/main'

import { actionButton, panel } from '../../widgets'
import Css from './main.module.scss'

const SEVERITIES: AlertSeverity[] = ['info', 'success', 'warning', 'error']

export class BodyView extends CubeElement<BodyScope> {
    protected declare(dom: Dom): void {
        panel(dom, {
            heading: 'Alert examples',
            content: () => {
                dom.div((pane) => {
                    pane.className = Css.buttonPane
                    for (const severity of SEVERITIES) {
                        actionButton(dom, {
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
