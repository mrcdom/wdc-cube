import { Logger, Presenter, Scope, ScopeSlot, PlaceUri, NOOP_VOID } from 'wdc-cube'
import { MainPresenter } from '../../main/Main.presenter'
import { ViewIds, AttrsIds, ParamsIds } from '../../Constants'
import { Places } from '../../Places'
import { TutorialService, SiteItemType } from '../../services/TutorialService'

const LOG = Logger.get('SubscriptionsPresenter')

// @Inject
const tutorialService = TutorialService.INSTANCE

export class SubscriptionsScope extends Scope {
    sites = [] as SiteItemType[]

    // Actions
    onItemClicked = Scope.ACTION1<SiteItemType>()
}

export class SubscriptionsPresenter extends Presenter<MainPresenter, SubscriptionsScope> {

    private parentSlot: ScopeSlot = NOOP_VOID

    public constructor(app: MainPresenter) {
        super(app, new SubscriptionsScope(ViewIds.subscriptions))
    }

    public override release() {
        super.release()
        LOG.info('Finalized')
    }

    public override async applyParameters(uri: PlaceUri, initialization: boolean): Promise<boolean> {
        if (initialization) {
            this.scope.bind(this)
            this.parentSlot = uri.getScopeSlot(AttrsIds.parentSlot)
            this.scope.sites = await tutorialService.fetchSubscribleSites()
            LOG.info('Initialized')
        }

        this.parentSlot(this.scope)

        return true
    }

    protected async onItemClicked(item: SiteItemType) {
        try {
            await this.flip(Places.subscriptionsDetail, {
                params: {
                    [ParamsIds.SiteId]: item.id
                },
                attrs: {
                    // Helping performance (avoid a unneeded service fetch)
                    [AttrsIds.subscriptionsDetail_item]: item
                }
            })
        } catch (caught) {
            this.unexpected(`Opening item ${JSON.stringify(item)}`, caught)
        } finally {
            this.update(this.scope)
        }
    }

}