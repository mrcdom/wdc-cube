import { CubeViewSlot } from 'wdc-cube-webc'
import { RestrictedScope } from 'wdc-cube-tutorial-app/restricted'

import { AppElement, type AppDom } from '../../widgets'

import Css from './restricted.module.scss'

export class RestrictedView extends AppElement<RestrictedScope> {
    private empty!: HTMLParagraphElement
    private detailSlot!: CubeViewSlot

    protected declare(dom: AppDom): void {
        dom.div((view) => {
            view.className = Css.restrictedView
            this.empty = dom.p((text) => (text.textContent = 'Nothing is nested under this place yet.'))
            // The slot this presenter offers to a deeper place. Passing its own
            // scope here would resolve back to this very view.
            this.detailSlot = new CubeViewSlot(dom.span())
        })
    }

    protected override onUpdate(): void {
        this.detailSlot.setScope(this.scope.detail)
        this.setVisible(this.empty, !this.scope.detail)
    }

    protected override onRelease(): void {
        this.detailSlot.setScope(undefined)
    }
}
