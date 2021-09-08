import Logger from '../utils/logger'
import { WebFlowPresenter, WebFlowScope, WebFlowScopeSlot, WebFlowURI, NOOP_VOID } from '../webflow2'
import { ApplicationPresenter } from '../ApplicationPresenter'
import { ViewIds, AttrsIds } from '../Common'

const LOG = Logger.get('Module2Detail')

export class Module2DetailScope extends WebFlowScope {

}

export class Module2DetailPresenter extends WebFlowPresenter<ApplicationPresenter, Module2DetailScope> {

    private parentSlot: WebFlowScopeSlot = NOOP_VOID

    public constructor(app: ApplicationPresenter) {
        super(app, new Module2DetailScope(ViewIds.module2Detail))
    }

    public override release() {
        LOG.info('Finalized')
        super.release()
    }

    public override async applyParameters(uri: WebFlowURI, initialization: boolean, deepest: boolean): Promise<boolean> {
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