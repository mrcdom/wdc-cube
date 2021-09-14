import { Logger, Presenter, Scope, ScopeSlot, PlaceUri, NOOP_VOID } from 'wdc-cube'
import { MainPresenter } from '../../main/Main.presenter'
import { ViewIds, AttrsIds } from '../../Constants'


const LOG = Logger.get('RestrictedPresenter')

export class MenuScope extends Scope {

}

export class RestrictedScope extends Scope {
    menu?: Scope
    detail?: Scope
}

export class RestrictedPresenter extends Presenter<MainPresenter, RestrictedScope> {

    private parentSlot: ScopeSlot = NOOP_VOID

    private readonly detailSlot: ScopeSlot = scope => {
        if (this.scope.detail !== scope) {
            this.scope.detail = scope
            this.scope.update()
        }
    }

    public constructor(app: MainPresenter) {
        super(app, new RestrictedScope(ViewIds.restricted))
    }

    public override release() {
        super.release()
        LOG.info('Finalized')
    }

    public override async applyParameters(uri: PlaceUri, initialization: boolean, deepest: boolean): Promise<boolean> {
        if (initialization) {
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