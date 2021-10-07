import { Logger, CubePresenter, ScopeSlot, FlipIntent, action, NOOP_VOID } from 'wdc-cube'
import { MainPresenter } from '../../main/Main.presenter'
import { Places, AttrIds, ParamIds } from '../../Constants'
import { TutorialService, SiteItemType } from '../../services/TutorialService'
import { SubscriptionsScope } from './Subscriptions.scopes'

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

    public override async applyParameters(uri: FlipIntent, initialization: boolean, last: boolean): Promise<boolean> {
        if (initialization) {
            this.parentSlot = uri.getScopeSlot(AttrIds.parentSlot)
            this.dialogSlot = uri.getScopeSlot(AttrIds.dialogSlot)

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

    @action()
    protected async onItemClicked(item: SiteItemType) {
        await this.flip(Places.subscriptionsDetail, {
            params: {
                [ParamIds.SiteId]: item.id
            },
            attrs: {
                // Helping performance (avoid a unneeded service fetch)
                [AttrIds.subscriptionsDetail_item]: item
            }
        })
    }

}