import { Logger, WebFlowPresenter, WebFlowScope, WebFlowScopeSlot, WebFlowURI, NOOP_VOID } from 'wdc-cube'
import { ApplicationPresenter } from '../ApplicationPresenter'
import { ViewIds, AttrsIds } from '../Constants'


const LOG = Logger.get('Module2Presenter')

export class Module2Scope extends WebFlowScope {
    detail?: WebFlowScope
}

export class Module2Presenter extends WebFlowPresenter<ApplicationPresenter, Module2Scope> {

    private parentSlot: WebFlowScopeSlot = NOOP_VOID

    private readonly detailSlot: WebFlowScopeSlot = scope => {
        if (this.scope.detail !== scope) {
            this.scope.detail = scope
            this.scope.update()
        }
    }

    public constructor(app: ApplicationPresenter) {
        super(app, new Module2Scope(ViewIds.module2))
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