import { Logger, Presenter, Scope, ScopeSlot, PlaceUri, NOOP_VOID, NOOP_PROMISE_VOID } from 'wdc-cube'
import { MainPresenter } from '../main/MainPresenter'
import { ViewIds, AttrsIds, ParamsIds } from '../Constants'
import { Places } from '../Places'
import { TutorialService, SiteItemType } from '../services/TutorialService'

const LOG = Logger.get('Module2Presenter')

// @Inject
const tutorialService = TutorialService.INSTANCE

export class Module2Scope extends Scope {
    detail?: Scope
    sites = [] as SiteItemType[]

    // Actions
    onItemClicked: (item: SiteItemType) => Promise<void> = NOOP_PROMISE_VOID
}

export class Module2Presenter extends Presenter<MainPresenter, Module2Scope> {

    private parentSlot: ScopeSlot = NOOP_VOID

    private readonly detailSlot: ScopeSlot = scope => {
        if (this.scope.detail !== scope) {
            this.scope.detail = scope
            this.scope.update()
        }
    }

    public constructor(app: MainPresenter) {
        super(app, new Module2Scope(ViewIds.module2))
    }

    public override release() {
        LOG.info('Finalized')
        super.release()
    }

    public override async applyParameters(uri: PlaceUri, initialization: boolean, deepest: boolean): Promise<boolean> {
        if (initialization) {
            this.scope.bind(this)
            this.parentSlot = uri.getScopeSlot(AttrsIds.parentSlot)
            this.scope.sites = await tutorialService.fetchSubscribleSites()
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

    protected async onItemClicked(item: SiteItemType) {
        try {
            const uri = this.app.newUri(Places.module2Detail)
            uri.setParameter(ParamsIds.SiteId, item.id)
            uri.attributes.set(AttrsIds.module2Detail_item, item)
            await this.app.navigate(uri)
        } catch (caught) {
            this.app.unexpected(LOG, `Opening item ${JSON.stringify(item)}`, caught)
        } finally {
            this.scope.update()
        }
    }

}