import Logger from '../utils/logger'
import { WebFlowPresenter, WebFlowScope, WebFlowScopeSlot, WebFlowURI, NOOP_VOID, NOOP_PROMISE_VOID } from '../webflow2'
import { Places } from '../Places'
import { ApplicationPresenter } from '../ApplicationPresenter'
import { ViewIds, AttrsIds } from '../Common'

const LOG = Logger.get('RootPresenter')

export class RootScope extends WebFlowScope {
    module?: WebFlowScope

    onRoot: () => Promise<void> = NOOP_PROMISE_VOID
    onModule1: () => Promise<void> = NOOP_PROMISE_VOID
    onModule2: () => Promise<void> = NOOP_PROMISE_VOID
    onModule1Detail: () => Promise<void> = NOOP_PROMISE_VOID
    onModule2Detail: () => Promise<void> = NOOP_PROMISE_VOID
}

export class RootPresenter extends WebFlowPresenter<ApplicationPresenter, RootScope> {

    private readonly moduleSlot: WebFlowScopeSlot

    private parentSlot: WebFlowScopeSlot = NOOP_VOID

    public constructor(app: ApplicationPresenter) {
        super(app, new RootScope(ViewIds.root))

        this.moduleSlot = scope => {
            this.scope.module = scope
            this.scope.update()
        }
    }

    public override release() {
        LOG.info('Finalized')
        super.release()
    }

    public override async applyParameters(uri: WebFlowURI, initialization: boolean, deepest: boolean): Promise<boolean> {
        if (initialization) {
            this.scope.onRoot = this.RootClicked.bind(this)
            this.scope.onModule1 = this.onModule1Clicked.bind(this)
            this.scope.onModule2 = this.onModule2Clicked.bind(this)
            this.scope.onModule1Detail = this.onModule1DetailClicked.bind(this)
            this.scope.onModule2Detail = this.onModule2DetailClicked.bind(this)
            this.parentSlot = uri.getScopeSlot(AttrsIds.parentSlot)
            LOG.info('Initialized')
        }

        if (deepest) {
            this.moduleSlot(undefined)
        } else {
            uri.setScopeSlot(AttrsIds.parentSlot, this.moduleSlot)
        }

        this.parentSlot(this.scope)

        return true
    }

    public async RootClicked() {
        try {
            const uri = this.app.newUri(Places.root)
            await this.app.navigate(uri)
        } catch (caught) {
            LOG.error('onRootClicked', caught)
        } finally {
            this.scope.update()
        }
    }

    public async onModule1Clicked() {
        try {
            const uri = this.app.newUri(Places.module1)
            await this.app.navigate(uri)
        } catch (caught) {
            LOG.error('onModule1Clicked', caught)
        } finally {
            this.scope.update()
        }
    }

    public async onModule1DetailClicked() {
        try {
            const uri = this.app.newUri(Places.module1Detail)
            await this.app.navigate(uri)
        } catch (caught) {
            LOG.error('onModule1DetailClicked', caught)
        } finally {
            this.scope.update()
        }
    }

    public async onModule2Clicked() {
        try {
            const uri = this.app.newUri(Places.module2)
            await this.app.navigate(uri)
        } catch (caught) {
            LOG.error('onModule2Clicked', caught)
        } finally {
            this.scope.update()
        }
    }

    public async onModule2DetailClicked() {
        try {
            const uri = this.app.newUri(Places.module2Detail)
            await this.app.navigate(uri)
        } catch (caught) {
            LOG.error('onModule2DetailClicked', caught)
        } finally {
            this.scope.update()
        }
    }

}