import { Logger, Presenter, Scope, ScopeSlot, Place, PlaceUri, NOOP_VOID } from 'wdc-cube'
import { MainPresenter } from '../../../main/Main.presenter'
import { ViewIds, AttrsIds, ParamsIds } from '../../../Constants'
import { TutorialService, SiteItemType } from '../../../services/TutorialService'

const LOG = Logger.get('SubscriptionsDetailPresenter')

// @Inject
const tutorialService = TutorialService.INSTANCE

const eMailRegExp = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

export class SubscriptionsDetailScope extends Scope {
    name?: string

    // Actions
    onClose = Scope.ACTION()
    onEmailChanged = Scope.ACTION1<string>()
    onSubscribe = Scope.ACTION()
}

export class SubscriptionsDetailPresenter extends Presenter<MainPresenter, SubscriptionsDetailScope> {

    private parentSlot: ScopeSlot = NOOP_VOID

    private item?: SiteItemType

    private email?: string

    private backPlace: Place

    public constructor(app: MainPresenter) {
        super(app, new SubscriptionsDetailScope(ViewIds.subscriptionsDetail))
        this.backPlace = app.lastPlace
    }

    public override release() {
        this.parentSlot(undefined)
        super.release()
        LOG.info('Finalized')
    }

    public override async applyParameters(uri: PlaceUri, initialization: boolean): Promise<boolean> {
        const paramSiteId = uri.getParameterAsNumberOrDefault(ParamsIds.SiteId, this.item?.id ?? -1)

        if (initialization) {
            this.backPlace = this.app.lastPlace

            if (paramSiteId <= 0) {
                throw new Error('No site id provided')
            }

            this.scope.bind(this)
            this.parentSlot = uri.getScopeSlot(AttrsIds.dialogSlot)

            let siteItem = uri.attributes.get(AttrsIds.subscriptionsDetail_item) as SiteItemType | undefined
            if (!siteItem) {
                siteItem = await tutorialService.fetchSiteItem(paramSiteId)
            }

            this.item = siteItem
            this.scope.name = this.item?.site
            this.update(this.scope)

            LOG.info('Initialized')
        } else if (this.item?.id !== paramSiteId) {
            this.item = await tutorialService.fetchSiteItem(paramSiteId)
            this.scope.name = this.item?.site
            this.update(this.scope)
            this.app.updateHistory()
        }

        this.parentSlot(this.scope)

        return true
    }

    public publishParameters(uri: PlaceUri): void {
        uri.setParameter(ParamsIds.SiteId, this.item?.id)
    }

    private async asyncClose() {
        await this.flip(this.backPlace)
    }

    protected async onClose() {
        try {
            await this.asyncClose()
        } catch (caught) {
            this.unexpected('Trying to close', caught)
        } finally {
            this.update(this.scope)
        }
    }

    protected async onSubscribe() {
        const app = this.app
        try {
            const siteId = this.item?.id
            if (!siteId) {
                throw new Error('Invalid case. SiteId must always be available here')
            }

            const email = (this.email || '').trim()
            if (email === '') {
                app.alert('warning', 'Field required', 'An e-mail is required in order to request a subscription')
                return
            }

            if (!eMailRegExp.test(email)) {
                app.alert('warning', 'Wrong value', 'The informed e-mail is not a valid email address')
                return
            }

            this.email = email

            await tutorialService.updateOrAddSiteSubscription(siteId, email)

            await this.asyncClose()
        } catch (caught) {
            app.unexpected('Trying to save', caught)
        } finally {
            this.update(this.scope)
        }
    }

    protected async onEmailChanged(eMail: string) {
        this.email = eMail
    }

}