import { Logger, Presenter, Scope, ScopeSlot, PlaceUri, NOOP_VOID } from 'wdc-cube'
import { ApplicationPresenter } from '../ApplicationPresenter'
import { ViewIds, AttrsIds } from '../Constants'

const LOG = Logger.get('Module2DetailPresenter')

export class Module2DetailScope extends Scope {

}

export class Module2DetailPresenter extends Presenter<ApplicationPresenter, Module2DetailScope> {

    private parentSlot: ScopeSlot = NOOP_VOID

    public constructor(app: ApplicationPresenter) {
        super(app, new Module2DetailScope(ViewIds.module2Detail))
    }

    public override release() {
        LOG.info('Finalized')
        super.release()
    }

    public override async applyParameters(uri: PlaceUri, initialization: boolean, deepest: boolean): Promise<boolean> {
        if (initialization) {
            this.parentSlot = uri.getScopeSlot(AttrsIds.parentSlot)
            LOG.info('Initialized')
        }

        if (deepest) {
            // NOOP
        }

        this.parentSlot(this.scope)

        return true
    }

}