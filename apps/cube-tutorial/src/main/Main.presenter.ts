import {
    Logger,
    ApplicationPresenter,
    HistoryManager,
    FlipIntent,
    Scope,
    action,
    AlertSeverity,
    SingletonServices,
    NOOP_PROMISE_VOID
} from 'wdc-cube'
import { Places, AttrIds } from '../Constants'
import { MainScope, BodyScope, AlertScope, IDialogScope } from './Main.scopes'

const LOG = Logger.get('MainPresenter')

export class MainPresenter extends ApplicationPresenter<MainScope> {
    // :: Instance

    private readonly bodyScope = new BodyScope()
    private readonly bodySlot = this.setBodySlot.bind(this)
    private readonly dialogSlot = this.setDialogSlot.bind(this)

    private stopServices = NOOP_PROMISE_VOID

    public constructor(historyManager: HistoryManager) {
        super(historyManager, new MainScope())

        // Important to allow newUriFromString to work properly
        this.setPlaces(Places)
    }

    initialize() {
        let initialized = false

        const bootstrap = async () => {
            try {
                await this.kickStart(Places.main)
                initialized = true
            } catch (error) {
                LOG.error('Initializing', error)
                this.release()
            }
        }

        bootstrap().catch(LOG.caught)

        return () => {
            if (initialized) {
                this.release()
            }
        }
    }

    public override release() {
        this.stopServices().catch(() => void 0)
        super.release()
    }

    public override async applyParameters(
        intent: FlipIntent,
        initialization: boolean,
        last?: boolean
    ): Promise<boolean> {
        if (initialization) {
            await this.intializeState()

            try {
                const targetUri = this.newIntentFromString(this.historyManager.location)
                if (targetUri.toString() !== intent.toString()) {
                    await this.flipToIntent(targetUri)
                    return false
                }
            } catch (caught) {
                this.unexpected('Navigation from history', caught)
            }
            this.update()
        }

        if (last) {
            this.bodySlot(undefined)
        } else {
            intent.setScopeSlot(AttrIds.parentSlot, this.bodySlot)
            intent.setScopeSlot(AttrIds.dialogSlot, this.dialogSlot)
        }

        return true
    }

    private async intializeState() {
        this.stopServices = await SingletonServices.start()

        this.scope.onHome = this.onHome.bind(this)
        this.scope.onOpenTodos = this.onOpenTodos.bind(this)
        this.scope.onOpenSuscriptions = this.onOpenSuscriptions.bind(this)
        this.scope.onLogin = this.onOpenLogin.bind(this)

        this.bodyScope.onOpenAlert = this.onOpenAlert.bind(this)
        this.bodyScope.update = this.update

        this.scope.body = this.bodyScope

        LOG.info('Initialized')
    }

    // :: Helper API

    public override unexpected(message: string, error: unknown) {
        super.unexpected(message, error)
        this.alert('error', 'Unexpected error', message)
    }

    public override alert(severity: AlertSeverity, title: string, message: string, onClose?: () => Promise<void>) {
        const alertScope = new AlertScope()
        alertScope.severity = severity
        alertScope.title = title
        alertScope.message = message
        alertScope.onClose = this.onCloseAlert.bind(this, onClose)
        alertScope.update = this.update
        this.scope.alert = alertScope
    }

    // :: View Actions

    protected async setBodySlot(scope: Scope | undefined | null) {
        this.scope.body = scope ?? this.bodyScope
    }

    protected async setDialogSlot(scope: Scope | undefined | null) {
        if (this.scope.dialog !== scope) {
            this.scope.dialog = scope as IDialogScope

            if (this.scope.dialog && !this.scope.dialog.onClose) {
                LOG.error(`Missing onClose action on scope ${this.scope.dialog.constructor.name}`)
            }
        }
    }

    @action()
    protected async onCloseAlert(onClose?: () => Promise<void>) {
        this.scope.alert = undefined
        if (onClose) {
            await onClose()
        }
    }

    @action()
    protected async onHome() {
        await this.flip(this.rootPlace)
    }

    @action()
    protected async onOpenTodos() {
        await this.flip(Places.todos)
    }

    @action()
    protected async onOpenSuscriptions() {
        await this.flip(Places.subscriptions)
    }

    @action()
    protected async onOpenLogin() {
        this.alert('info', 'Working in progress...', 'No implementation to this action, yet.')
    }

    @action()
    protected async onOpenAlert(severity: AlertSeverity) {
        LOG.info('onAlert clicked')
        this.alert(severity, 'Some title', 'Some message', async () => {
            LOG.info(`Alert with severity ${severity} was closed`)
        })
    }
}
