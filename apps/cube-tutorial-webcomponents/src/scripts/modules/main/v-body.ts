import type { AlertSeverity } from 'wdc-cube'
import { CubeElement, Dom } from 'wdc-cube-webcomponents'
import { BodyScope } from 'wdc-cube-tutorial-core/main'

import Css from './main.module.scss'

const SEVERITIES: AlertSeverity[] = ['info', 'success', 'warning', 'error']

export class BodyView extends CubeElement<BodyScope> {
    protected declare(dom: Dom): void {
        dom.div((view) => {
            view.className = Css.bodyView

            dom.h3((heading) => (heading.textContent = 'Alert examples'))

            dom.div((pane) => {
                pane.className = Css.buttonPane
                for (const severity of SEVERITIES) {
                    dom.button((button) => {
                        button.textContent = severity
                        button.addEventListener('click', () =>
                            this.safeAction(`onOpenAlert:${severity}`, () => this.scope.onOpenAlert(severity))
                        )
                    })
                }
            })
        })
    }
}
