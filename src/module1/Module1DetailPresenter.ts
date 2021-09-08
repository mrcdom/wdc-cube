import Logger from '../utils/logger'
import { WebFlowPresenter, WebFlowScope, WebFlowScopeSlot, WebFlowURI, NOOP_VOID } from '../webflow'
import { ApplicationPresenter } from '../ApplicationPresenter'
import { ViewIds, AttrsIds } from '../Common'

const LOG = Logger.get('Module1DetailPresenter')

export class Module1DetailScope extends WebFlowScope {

}

export class Module1DetailPresenter extends WebFlowPresenter<ApplicationPresenter, Module1DetailScope> {

    private parentSlot: WebFlowScopeSlot = NOOP_VOID

    public constructor(app: ApplicationPresenter) {
        super(app, new Module1DetailScope(ViewIds.module1Detail))
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