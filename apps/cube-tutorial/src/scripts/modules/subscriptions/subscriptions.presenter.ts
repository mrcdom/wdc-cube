import { Logger, CubePresenter, ScopeSlot, FlipIntent, NOOP_VOID } from 'wdc-cube'
import { MainPresenter } from '../main/main.presenter'
import { TutorialService, type SiteItemType } from '../../services/TutorialService'
import { SubstriptionsKeys } from './subscriptions.key'
import { SubstriptionsDetailKeys } from './subscriptions-detail.key'
import { SubscriptionsScope } from './subscriptions.scope'

const LOG = Logger.get('SubscriptionsPresenter')

// @Inject
const tutorialService = TutorialService.INSTANCE

export class SubscriptionsPresenter extends CubePresenter<MainPresenter, SubscriptionsScope> {
    private parentSlot: ScopeSlot = NOOP_VOID
    private dialogSlot: ScopeSlot = NOOP_VOID

    public constructor(app: MainPresenter) {
        super(app, new SubscriptionsScope())
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
        const keys = new SubstriptionsKeys(this.app, intent)

        if (initialization) {
            this.parentSlot = keys.parentSlot
            this.dialogSlot = keys.dialogSlot

            this.scope.onItemClicked = this.action(this.onItemClicked)
            this.scope.sites = await tutorialService.fetchSubscribleSites()

            LOG.info('Initialized')
        }

        if (last) {
            this.dialogSlot(undefined)
        }

        this.parentSlot(this.scope)

        return true
    }

    protected async onItemClicked(item: SiteItemType) {
        const targetKeys = new SubstriptionsDetailKeys(this.app)
        targetKeys.siteId = item.id
        targetKeys.item = item
        await targetKeys.flip()
    }
}
