import { Logger, CubePresenter, ScopeSlot, FlipIntent, NOOP_VOID } from 'wdc-cube'
import { MainPresenter } from '../../main/Main.presenter'
import { AttrIds } from '../../Constants'
import { RestrictedScope } from './Restricted.scopes'

const LOG = Logger.get('RestrictedPresenter')

export class RestrictedPresenter extends CubePresenter<MainPresenter, RestrictedScope> {

    private parentSlot: ScopeSlot = NOOP_VOID

    private readonly detailSlot: ScopeSlot = scope => {
        if (this.scope.detail !== scope) {
            this.scope.detail = scope
            this.update()
        }
    }

    public constructor(app: MainPresenter) {
        super(app, new RestrictedScope())
    }

    public override release() {
        super.release()
        LOG.info('Finalized')
    }

    public override async applyParameters(intent: FlipIntent, initialization: boolean, last: boolean): Promise<boolean> {
        if (initialization) {
            this.parentSlot = intent.getScopeSlot(AttrIds.parentSlot)
            LOG.info('Initialized')
        }

        if (last) {
            this.detailSlot(undefined)
        } else {
            intent.setScopeSlot(AttrIds.parentSlot, this.detailSlot)
        }

        this.parentSlot(this.scope)

        return true
    }

}