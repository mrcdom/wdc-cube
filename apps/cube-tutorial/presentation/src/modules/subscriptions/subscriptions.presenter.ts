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

        // Attributes come from the level above, which may change its mind between
        // flips: read them on every call, not only on initialization.
        this.parentSlot = keys.parentSlot
        this.dialogSlot = keys.dialogSlot

        // The screen goes up before anything is fetched.
        this.parentSlot(this.scope)

        if (initialization) {
            this.scope.onItemClicked = this.action(this.onItemClicked)

            // Loaded in parallel. The dialog below this place does not need the list, and
            // waiting here would leave a cold start into it with an empty body meanwhile.
            this.loadSites().catch((caught) => this.app.unexpected('Loading the sites', caught))

            LOG.info('Initialized')
        }

        if (last) {
            this.dialogSlot(undefined)
        }

        return true
    }

    private async loadSites() {
        this.scope.sites = await tutorialService.fetchSubscribleSites()
    }

    protected async onItemClicked(item: SiteItemType) {
        const targetKeys = new SubstriptionsDetailKeys(this.app)
        targetKeys.siteId = item.id
        targetKeys.item = item
        await targetKeys.flip()
    }
}
