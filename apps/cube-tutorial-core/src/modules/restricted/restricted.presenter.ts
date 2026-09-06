import { Logger, CubePresenter, ScopeSlot, FlipIntent, NOOP_VOID } from 'wdc-cube'
import { MainPresenter } from '../main/main.presenter'
import { RestrictedKeys } from './restricted.key'
import { RestrictedScope } from './restricted.scope'

const LOG = Logger.get('RestrictedPresenter')

export class RestrictedPresenter extends CubePresenter<MainPresenter, RestrictedScope> {
    private parentSlot: ScopeSlot = NOOP_VOID

    private readonly detailSlot: ScopeSlot = (scope) => {
        this.scope.detail = scope
    }

    public constructor(app: MainPresenter) {
        super(app, new RestrictedScope())
    }

    public override release() {
        super.release()
        LOG.info('Finalized')
    }

    public override async applyParameters(
        intent: FlipIntent,
        initialization: boolean,
        last: boolean
    ): Promise<boolean> {
        const keys = new RestrictedKeys(this.app, intent)

        if (initialization) {
            this.parentSlot = keys.parentSlot
            LOG.info('Initialized')
        }

        if (last) {
            this.detailSlot(undefined)
        } else {
            keys.parentSlot = this.detailSlot
        }

        this.parentSlot(this.scope)

        return true
    }
}
