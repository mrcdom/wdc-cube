import { CubeElement, CubeViewSlot, Dom } from 'wdc-cube-webcomponents'
import { RestrictedScope } from 'wdc-cube-tutorial-core/restricted'

export class RestrictedView extends CubeElement<RestrictedScope> {
    private empty!: HTMLParagraphElement
    private detailHost!: HTMLElement
    private detailSlot?: CubeViewSlot

    protected declare(dom: Dom): void {
        dom.div((view) => {
            view.className = 'restricted-view'
            this.empty = dom.p((text) => (text.textContent = 'Nothing is nested under this place yet.'))
            // The slot this presenter offers to a deeper place. Passing its own
            // scope here would resolve back to this very view.
            this.detailHost = dom.span()
        })
    }

    protected override onUpdate(): void {
        this.detailSlot ??= new CubeViewSlot(this.detailHost)
        this.detailSlot.setScope(this.scope.detail)
        this.setVisible(this.empty, !this.scope.detail)
    }

    protected override onRelease(): void {
        this.detailSlot?.setScope(undefined)
    }
}
