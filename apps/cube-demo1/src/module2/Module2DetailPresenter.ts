import { Logger, Presenter, Scope, ScopeSlot, PlaceUri, NOOP_VOID, NOOP_PROMISE_VOID } from 'wdc-cube'
import { Places } from '../Places'
import { MainPresenter } from '../main/MainPresenter'
import { ViewIds, AttrsIds, ParamsIds } from '../Constants'
import { TutorialService, SiteItemType } from '../services/TutorialService'

const LOG = Logger.get('Module2DetailPresenter')

// @Inject
const tutorialService = TutorialService.INSTANCE

const eMailRegExp = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

export class Module2DetailScope extends Scope {
    name?: string

    // Actions
    onClose: () => Promise<void> = NOOP_PROMISE_VOID
    onEmailChanged: (eMail: string) => Promise<void> = NOOP_PROMISE_VOID
    onSubscribe: () => Promise<void> = NOOP_PROMISE_VOID
}

export class Module2DetailPresenter extends Presenter<MainPresenter, Module2DetailScope> {

    private parentSlot: ScopeSlot = NOOP_VOID

    private item?: SiteItemType

    private eMail?: string

    public constructor(app: MainPresenter) {
        super(app, new Module2DetailScope(ViewIds.module2Detail))
    }

    public override release() {
        this.parentSlot(undefined)
        super.release()
        LOG.info('Finalized')
    }

    public override async applyParameters(uri: PlaceUri, initialization: boolean, deepest: boolean): Promise<boolean> {
        const paramSiteId = uri.getParameterAsNumberOrDefault(ParamsIds.SiteId, this.item?.id ?? -1)

        if (initialization) {
            if (paramSiteId <= 0) {
                throw new Error('No site id provided')
            }

            this.scope.bind(this)
            this.parentSlot = uri.getScopeSlot(AttrsIds.dialogSlot)

            let siteItem = uri.attributes.get(AttrsIds.module2Detail_item) as SiteItemType | undefined
            if (!siteItem) {
                siteItem = await tutorialService.fetchSiteItem(paramSiteId)
            }

            this.item = siteItem
            this.scope.name = this.item?.site
            this.scope.update()

            LOG.info('Initialized')
        } else if (this.item?.id !== paramSiteId) {
            this.item = await tutorialService.fetchSiteItem(paramSiteId)
            this.scope.name = this.item?.site
            this.scope.update()
            this.app.updateHistory()
        }

        if (deepest) {
            // NOOP
        }

        this.parentSlot(this.scope)

        return true
    }

    public publishParameters(uri: PlaceUri): void {
        uri.setParameter(ParamsIds.SiteId, this.item?.id)
    }

    private async asyncClose() {
        const uri = this.app.newUri(Places.module2)
        await this.app.navigate(uri)
    }

    protected async onClose() {
        try {
            await this.asyncClose()
        } catch (caught) {
            this.app.unexpected(LOG, 'Trying to close', caught)
        } finally {
            this.scope.update()
        }
    }

    protected async onSubscribe() {
        const app = this.app
        try {
            const siteId = this.item?.id
            if (!siteId) {
                throw new Error('Invalid case. SiteId must always be available here')
            }

            const email = (this.eMail || '').trim()
            if (email === '') {
                app.alert('warning', 'Field required', 'An e-mail is required in order to request a subscription')
                return
            }

            if (!eMailRegExp.test(email)) {
                app.alert('warning', 'Wrong value', 'The informed e-mail is not a valid email address')
                return
            }

            this.eMail = email

            await tutorialService.updateOrAddSiteSubscription(siteId, email)

            await this.asyncClose()
        } catch (caught) {
            app.unexpected(LOG, 'Trying to save', caught)
        } finally {
            this.scope.update()
        }
    }

    protected async onEmailChanged(eMail: string) {
        this.eMail = eMail
    }

}