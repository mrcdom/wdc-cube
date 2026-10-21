import { Logger, CubePresenter, ScopeSlot, FlipIntent, NOOP_VOID } from 'wdc-cube'
import { MainPresenter } from '../main/main.presenter'
import { Places } from '../RouteConsts'
import { TutorialService, type SiteItemType } from '../../services/TutorialService'
import { SubstriptionsDetailKeys } from './subscriptions-detail.key'
import { SubscriptionsDetailScope } from './subscriptions-detail.scope'

const LOG = Logger.get('SubscriptionsDetailPresenter')

// @Inject
const tutorialService = TutorialService.INSTANCE

const eMailRegExp =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

export class SubscriptionsDetailPresenter extends CubePresenter<MainPresenter, SubscriptionsDetailScope> {
    private dialogSlot: ScopeSlot = NOOP_VOID

    /** The site this dialog is about. Known from the address before its data arrives. */
    private siteId?: number

    private item?: SiteItemType

    private email?: string

    /** Bumped on every load: a response that is no longer the latest stays silent. */
    private pending = 0

    private previousIntent?: FlipIntent

    public constructor(app: MainPresenter) {
        super(app, new SubscriptionsDetailScope())
    }

    public override release() {
        this.dialogSlot(undefined)
        super.release()
        LOG.info('Finalized')
    }

    public override async applyParameters(intent: FlipIntent, initialization: boolean): Promise<boolean> {
        const keys = new SubstriptionsDetailKeys(this.app, intent)

        // Attributes come from the level above, which may change its mind between
        // flips: read them on every call, not only on initialization.
        this.dialogSlot = keys.dialogSlot
        // The row already in hand, when the flip came from a click on the list.
        const arrived = keys.item

        // The keys only hand back a usable id. With none, there is no dialog to show:
        // redirect to the list with the intent in transit, mid-flip.
        const siteId = keys.siteId
        if (siteId === undefined) {
            await this.app.flipToIntent(intent.redirect(Places.subscriptions))
            return false
        }

        if (initialization) {
            // Only somewhere the user has actually been. On a cold start straight
            // into this dialog — a reload, or a shared link — nothing has been
            // visited yet and lastPlace would name the root place; taking that at
            // face value made Cancel leave the module altogether. close() falls
            // back to the list when there is nowhere to return to.
            if (this.app.hasNavigated) {
                this.previousIntent = this.app.newFlipIntent(this.app.lastPlace)
            }

            this.scope.onClose = this.action(this.onClose)
            this.scope.onSubscribe = this.action(this.onSubscribe)

            // handleEmailChanged is not an action: it only mirrors the typed
            // value, without triggering an update or a history entry
            this.scope.onEmailChanged = this.handleEmailChanged.bind(this)

            LOG.info('Initialized')
        }

        // The dialog goes up before its data: the previous screen does not stay frozen
        // in front while the site loads.
        this.dialogSlot(this.scope)

        if (siteId !== this.siteId) {
            // In parallel, so the flip ends here.
            this.showSite(siteId, arrived).catch((caught) => this.app.unexpected('Loading the site', caught))
        }

        return true
    }

    public override publishParameters(intent: FlipIntent): void {
        const keys = new SubstriptionsDetailKeys(this.app, intent)
        keys.siteId = this.siteId
    }

    private async showSite(siteId: number, arrived?: SiteItemType) {
        const token = ++this.pending

        this.siteId = siteId
        this.item = undefined
        // The site is what the dialog names; the e-mail field starts empty.
        // Both used to be `email`, which every view read for the message and
        // one of them also bound to the field — so the field opened holding a
        // domain name that its own validation then rejected.
        this.scope.site = undefined
        this.scope.email = ''
        this.email = ''

        let item: SiteItemType | undefined
        try {
            item = arrived?.id === siteId ? arrived : await tutorialService.fetchSiteItem(siteId)
        } catch (caught) {
            if (token !== this.pending) {
                return
            }
            // A well-formed id the service does not know, from an old or edited link.
            LOG.warn(`No site under id=${siteId}`, caught)
            this.alert('warning', 'Unknown site', `There is no site with id ${siteId} to subscribe to.`)
            await this.close()
            return
        }

        if (token !== this.pending) {
            return
        }

        this.item = item
        this.scope.site = item?.site
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
        if (this.previousIntent) {
            await this.flipToIntent(this.previousIntent)
        } else {
            await this.flip(Places.subscriptions)
        }
    }
}
