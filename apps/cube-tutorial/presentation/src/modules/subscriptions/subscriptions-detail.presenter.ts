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

    private item?: SiteItemType

    private email?: string

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

        const paramSiteId = keys.siteId ?? this.item?.id ?? -1

        if (initialization) {
            // Only somewhere the user has actually been. On a cold start straight
            // into this dialog — a reload, or a shared link — nothing has been
            // visited yet and lastPlace would name the root place; taking that at
            // face value made Cancel leave the module altogether. close() falls
            // back to the list when there is nowhere to return to.
            if (this.app.hasNavigated) {
                this.previousIntent = this.app.newFlipIntent(this.app.lastPlace)
            }

            if (paramSiteId <= 0) {
                throw new Error('No site id provided')
            }

            this.scope.onClose = this.action(this.onClose)
            this.scope.onSubscribe = this.action(this.onSubscribe)

            // handleEmailChanged is not an action: it only mirrors the typed
            // value, without triggering an update or a history entry
            this.scope.onEmailChanged = this.handleEmailChanged.bind(this)

            this.dialogSlot = keys.dialogSlot

            let siteItem = keys.item
            if (!siteItem) {
                siteItem = await tutorialService.fetchSiteItem(paramSiteId)
            }

            this.item = siteItem
            // The site is what the dialog names; the e-mail field starts empty.
            // Both used to be `email`, which every view read for the message and
            // one of them also bound to the field — so the field opened holding a
            // domain name that its own validation then rejected.
            this.scope.site = this.item?.site

            LOG.info('Initialized')
        } else if (this.item?.id !== paramSiteId) {
            this.item = await tutorialService.fetchSiteItem(paramSiteId)
            this.scope.site = this.item?.site
            this.scope.email = ''
            this.email = ''
            this.update()
        }

        this.dialogSlot(this.scope)

        return true
    }

    public override publishParameters(intent: FlipIntent): void {
        const keys = new SubstriptionsDetailKeys(this.app, intent)
        keys.siteId = this.item?.id
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
