import { Logger, CubePresenter, Scope, ScopeSlot, PlaceUri, NOOP_VOID } from 'wdc-cube'
import { MainPresenter } from '../../main/Main.presenter'
import { AttrIds } from '../../Constants'


const LOG = Logger.get('RestrictedPresenter')

export class RestrictedScope extends Scope {
    menu?: Scope
    detail?: Scope
}

export class RestrictedPresenter extends CubePresenter<MainPresenter, RestrictedScope> {

    private parentSlot: ScopeSlot = NOOP_VOID

    private readonly detailSlot: ScopeSlot = scope => {
        if (this.scope.detail !== scope) {
            this.scope.detail = scope
            this.scope.update()
        }
    }

    public constructor(app: MainPresenter) {
        super(app, new RestrictedScope())
    }

    public override release() {
        super.release()
        LOG.info('Finalized')
    }

    public override async applyParameters(uri: PlaceUri, initialization: boolean, last: boolean): Promise<boolean> {
        if (initialization) {
            this.parentSlot = uri.getScopeSlot(AttrIds.parentSlot)
            LOG.info('Initialized')
        }

        if (last) {
            this.detailSlot(undefined)
        } else {
            uri.setScopeSlot(AttrIds.parentSlot, this.detailSlot)
        }

        this.parentSlot(this.scope)

        return true
    }

}