import { Logger, CubePresenter, Scope, ScopeSlot, PlaceUri, NOOP_VOID } from 'wdc-cube'
import { MainPresenter } from '../../../main/Main.presenter'
import { AttrsIds, ParamsIds, Places } from '../../../Constants'
import { TutorialService, SiteItemType } from '../../../services/TutorialService'

const LOG = Logger.get('SubscriptionsDetailPresenter')

// @Inject
const tutorialService = TutorialService.INSTANCE

const eMailRegExp = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

export class SubscriptionsDetailScope extends Scope {
    email?: string

    // Actions
    onClose = Scope.ASYNC_ACTION
    onSubscribe = Scope.ASYNC_ACTION
    onEmailChanged = Scope.SYNC_ACTION_STRING
}

export class SubscriptionsDetailPresenter extends CubePresenter<MainPresenter, SubscriptionsDetailScope> {

    private dialogSlot: ScopeSlot = NOOP_VOID

    private item?: SiteItemType

    private email?: string

    private backUri?: PlaceUri

    public constructor(app: MainPresenter) {
        super(app, new SubscriptionsDetailScope())
    }

    public override release() {
        this.dialogSlot(undefined)
        super.release()
        LOG.info('Finalized')
    }

    public override async applyParameters(uri: PlaceUri, initialization: boolean): Promise<boolean> {
        const paramSiteId = uri.getParameterAsNumberOrDefault(ParamsIds.SiteId, this.item?.id ?? -1)

        if (initialization) {
            this.backUri = this.app.newUri(this.app.lastPlace)

            if (paramSiteId <= 0) {
                throw new Error('No site id provided')
            }

            this.scope.onClose = this.onClose.bind(this)
            this.scope.onEmailChanged = this.handleEmailChanged.bind(this)
            this.scope.onSubscribe = this.onSubscribe.bind(this)

            this.dialogSlot = uri.getScopeSlot(AttrsIds.dialogSlot)

            let siteItem = uri.attributes.get(AttrsIds.subscriptionsDetail_item) as SiteItemType | undefined
            if (!siteItem) {
                siteItem = await tutorialService.fetchSiteItem(paramSiteId)
            }

            this.item = siteItem
            this.scope.email = this.item?.site

            LOG.info('Initialized')
        } else if (this.item?.id !== paramSiteId) {
            this.item = await tutorialService.fetchSiteItem(paramSiteId)
            this.scope.email = this.item?.site
            this.update()
        }

        this.dialogSlot(this.scope)

        return true
    }

    public override publishParameters(uri: PlaceUri): void {
        uri.setParameter(ParamsIds.SiteId, this.item?.id)
    }

    protected async onClose() {
        await this.close()
    }

    protected async onSubscribe() {
        const siteId = this.item?.id
        if (!siteId) {
            throw new Error('Invalid case. SiteId must always be available here')
        }

        const email = (this.email || '').trim()
        if (email === '') {
            this.alert('warning', 'Field required', 'An e-mail is required in order to request a subscription')
            return
        }

        if (!eMailRegExp.test(email)) {
            this.alert('warning', 'Wrong value', 'The informed e-mail is not a valid email address')
            return
        }

        this.email = email

        await tutorialService.updateOrAddSiteSubscription(siteId, email)

        await this.close()
    }

    protected handleEmailChanged(eMail: string) {
        this.email = eMail
    }

    protected async close() {
        if (this.backUri) {
            await this.flipToUri(this.backUri)
        } else {
            await this.flip(Places.subscriptions)
        }
    }

}