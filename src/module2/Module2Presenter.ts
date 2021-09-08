import Logger from '../utils/logger'
import { WebFlowPresenter, WebFlowScope, WebFlowScopeSlot, WebFlowURI, NOOP_VOID } from '../webflow'
import { ApplicationPresenter } from '../ApplicationPresenter'
import { ViewIds, AttrsIds } from '../Common'


const LOG = Logger.get('Module2')

export class Module2Scope extends WebFlowScope {
    detail?: WebFlowScope
}

export class Module2Presenter extends WebFlowPresenter<ApplicationPresenter, Module2Scope> {

    private readonly detailSlot: WebFlowScopeSlot

    private parentSlot: WebFlowScopeSlot = NOOP_VOID

    public constructor(app: ApplicationPresenter) {
        super(app, new Module2Scope(ViewIds.module2))

        this.detailSlot = scope => {
            this.scope.detail = scope
            this.scope.update()
        }
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
            this.detailSlot(undefined)
        } else {
            uri.setScopeSlot(AttrsIds.parentSlot, this.detailSlot)
        }

        this.parentSlot(this.scope)

        return true
    }

}