import Logger from '../utils/logger'
import { WebFlowPresenter, WebFlowScope, WebFlowScopeSlot, WebFlowURI, NOOP_VOID } from '../webflow'
import { ApplicationPresenter } from '../ApplicationPresenter'
import { ViewIds, AttrsIds } from '../Common'

const LOG = Logger.get('Module1Presenter')

export class Module1Scope extends WebFlowScope {
    detail?: WebFlowScope
}

export class Module1Presenter extends WebFlowPresenter<ApplicationPresenter, Module1Scope> {

    private parentSlot: WebFlowScopeSlot = NOOP_VOID

    private readonly detailSlot: WebFlowScopeSlot = scope => {
        if (this.scope.detail !== scope) {
            this.scope.detail = scope
            this.scope.update()
        }
    }

    public constructor(app: ApplicationPresenter) {
        super(app, new WebFlowScope(ViewIds.module1))
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