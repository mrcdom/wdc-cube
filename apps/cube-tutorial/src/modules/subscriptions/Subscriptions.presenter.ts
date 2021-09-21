import { Logger, CubePresenter, Scope, ScopeSlot, PlaceUri, NOOP_VOID } from 'wdc-cube'
import { MainPresenter } from '../../main/Main.presenter'
import { Places, AttrsIds, ParamsIds } from '../../Constants'
import { TutorialService, SiteItemType } from '../../services/TutorialService'

const LOG = Logger.get('SubscriptionsPresenter')

// @Inject
const tutorialService = TutorialService.INSTANCE

export class SubscriptionsScope extends Scope {
    sites = [] as SiteItemType[]

    // Actions
    onItemClicked = Scope.ASYNC_ACTION_ONE<SiteItemType>()
}

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

    public override async applyParameters(uri: PlaceUri, initialization: boolean, last: boolean): Promise<boolean> {
        if (initialization) {
            this.parentSlot = uri.getScopeSlot(AttrsIds.parentSlot)
            this.dialogSlot = uri.getScopeSlot(AttrsIds.dialogSlot)

            this.scope.onItemClicked = this.onItemClicked.bind(this)
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
        await this.flip(Places.subscriptionsDetail, {
            params: {
                [ParamsIds.SiteId]: item.id
            },
            attrs: {
                // Helping performance (avoid a unneeded service fetch)
                [AttrsIds.subscriptionsDetail_item]: item
            }
        })
    }

}