import { Logger, Presenter, Scope, ScopeSlot, PlaceUri, NOOP_VOID } from 'wdc-cube'
import { MainPresenter } from '../main/MainPresenter'
import { ViewIds, AttrsIds } from '../Constants'

const LOG = Logger.get('Module1Presenter')

export class Module1Scope extends Scope {
    detail?: Scope
}

export class Module1Presenter extends Presenter<MainPresenter, Module1Scope> {

    private parentSlot: ScopeSlot = NOOP_VOID

    private readonly detailSlot: ScopeSlot = scope => {
        if (this.scope.detail !== scope) {
            this.scope.detail = scope
            this.scope.update()
        }
    }

    public constructor(app: MainPresenter) {
        super(app, new Scope(ViewIds.module1))
    }

    public override release() {
        LOG.info('Finalized')
        super.release()
    }

    public override async applyParameters(uri: PlaceUri, initialization: boolean, deepest: boolean): Promise<boolean> {
        if (initialization) {
            this.scope.bind(this)
            this.parentSlot = uri.getScopeSlot(AttrsIds.parentSlot)
            LOG.info('Initialized')
        }

        if (deepest) {
            this.detailSlot(undefined)
        } else {
            uri.setScopeSlot(AttrsIds.parentSlot, this.detailSlot)
        }

        this.parentSlot(this.scope)

        return true
    }

}