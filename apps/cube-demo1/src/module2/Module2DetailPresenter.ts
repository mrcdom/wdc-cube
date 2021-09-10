import { Logger, Presenter, Scope, ScopeSlot, PlaceUri, NOOP_VOID, NOOP_PROMISE_VOID } from 'wdc-cube'
import { Places } from '../Places'
import { MainPresenter } from '../main/MainPresenter'
import { ViewIds, AttrsIds } from '../Constants'

const LOG = Logger.get('Module2DetailPresenter')

export class Module2DetailScope extends Scope {
    // Actions
    onClose: () => Promise<void> = NOOP_PROMISE_VOID
    onSubscribe: () => Promise<void> = NOOP_PROMISE_VOID
}

export class Module2DetailPresenter extends Presenter<MainPresenter, Module2DetailScope> {

    private parentSlot: ScopeSlot = NOOP_VOID

    public constructor(app: MainPresenter) {
        super(app, new Module2DetailScope(ViewIds.module2Detail))
    }

    public override release() {
        this.parentSlot(undefined)
        super.release()
        LOG.info('Finalized')
    }

    public override async applyParameters(uri: PlaceUri, initialization: boolean, deepest: boolean): Promise<boolean> {
        if (initialization) {
            this.scope.bind(this)
            this.parentSlot = uri.getScopeSlot(AttrsIds.dialogSlot)
            LOG.info('Initialized')
        }

        if (deepest) {
            // NOOP
        }

        this.parentSlot(this.scope)

        return true
    }

    private async asyncClose() {
        const uri = this.app.newUri(Places.module2)
        await this.app.navigate(uri)
    }

    protected async onClose() {
        try {
            await this.asyncClose()
        } catch (caught) {
            LOG.error('onClose', caught)
        } finally {
            this.scope.update()
        }
    }

    protected async onSubscribe() {
        try {
            await this.asyncClose()
        } catch (caught) {
            LOG.error('onSubscribe', caught)
        } finally {
            this.scope.update()
        }
    }

}