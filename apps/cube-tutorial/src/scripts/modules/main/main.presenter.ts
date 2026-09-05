import {
    Logger,
    ApplicationPresenter,
    HistoryManager,
    FlipIntent,
    Scope,
    type AlertSeverity,
    SingletonServices,
    NOOP_PROMISE_VOID
} from 'wdc-cube'
import { Places } from '../RouteConsts'
import { MainKeys } from './main.key'
import { MainScope, BodyScope, AlertScope, IDialogScope } from './main.scope'

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
        const keys = new MainKeys(this, intent)

        if (initialization) {
            await this.intializeState(keys)

            try {
                const targetUri = this.newIntentFromString(this.historyManager.location)
                if (targetUri.toString() !== intent.toString()) {
                    await this.flipToIntent(targetUri)
                    return false
                }
            } catch (caught) {
                this.unexpected('Navigation from history', caught)
            }
        }

        if (last) {
            this.bodySlot(undefined)
        } else {
            keys.parentSlot = this.bodySlot
            keys.dialogSlot = this.dialogSlot
        }

        return true
    }

    private async intializeState(keys: MainKeys) {
        this.stopServices = await SingletonServices.start()

        this.scope.onHome = this.action(this.onHome)
        this.scope.onOpenTodos = this.action(this.onOpenTodos)
        this.scope.onOpenSuscriptions = this.action(this.onOpenSuscriptions)
        this.scope.onLogin = this.action(this.onOpenLogin)

        this.bodyScope.onOpenAlert = this.action(this.onOpenAlert)
        this.bodyScope.update = this.update

        this.scope.body = this.bodyScope

        LOG.info(`Initialized(${keys.toString()})`)
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
        alertScope.onClose = this.action(this.onCloseAlert.bind(this, onClose))
        alertScope.update = this.update
        this.scope.alert = alertScope
    }

    // :: View Actions

    protected setBodySlot(scope: Scope | undefined | null) {
        this.scope.body = scope ?? this.bodyScope
    }

    protected setDialogSlot(scope: Scope | undefined | null) {
        if (this.scope.dialog !== scope) {
            this.scope.dialog = scope as IDialogScope

            if (this.scope.dialog && !this.scope.dialog.onClose) {
                LOG.error(`Missing onClose action on scope ${this.scope.dialog.constructor.name}`)
            }
        }
    }

    protected async onCloseAlert(onClose?: () => Promise<void>) {
        this.scope.alert = undefined
        if (onClose) {
            await onClose()
        }
    }

    protected async onHome() {
        await this.flip(this.rootPlace)
    }

    protected async onOpenTodos() {
        await this.flip(Places.todos)
    }

    protected async onOpenSuscriptions() {
        await this.flip(Places.subscriptions)
    }

    protected async onOpenLogin() {
        this.alert('info', 'Working in progress...', 'No implementation to this action, yet.')
    }

    protected async onOpenAlert(severity: AlertSeverity) {
        LOG.info('onAlert clicked')
        this.alert(severity, 'Some title', 'Some message', async () => {
            LOG.info(`Alert with severity ${severity} was closed`)
        })
    }
}
