import { Logger, Presenter, Scope, ScopeSlot, PlaceUri, NOOP_VOID } from 'wdc-cube'
import { ApplicationPresenter } from '../ApplicationPresenter'
import { ViewIds, AttrsIds } from '../Constants'

const LOG = Logger.get('Module1DetailPresenter')

export class Module1DetailScope extends Scope {

}

export class Module1DetailPresenter extends Presenter<ApplicationPresenter, Module1DetailScope> {

    private parentSlot: ScopeSlot = NOOP_VOID

    public constructor(app: ApplicationPresenter) {
        super(app, new Module1DetailScope(ViewIds.module1Detail))
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