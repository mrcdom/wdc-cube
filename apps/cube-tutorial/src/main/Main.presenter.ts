import {
    Logger,
    ApplicationPresenter,
    HistoryManager,
    PlaceUri,
    Scope,
    AlertSeverity,
    SingletonServices,
    NOOP_PROMISE_VOID
} from 'wdc-cube'
import { registerServices } from '../services'
import { Places, AttrIds } from '../Constants'
import { buildCube } from '../Cube'

const LOG = Logger.get('MainPresenter')

registerServices()

type IDialogScope = Scope & { onClose: () => Promise<void> }

export class AlertScope extends Scope {
    severity: AlertSeverity = 'info'
    title?: string
    message?: string

    onClose = Scope.ASYNC_ACTION
}

export class BodyScope extends Scope {
    onOpenAlert = Scope.ASYNC_ACTION_ONE<AlertSeverity>()
}

export class MainScope extends Scope {
    body?: Scope
    dialog?: IDialogScope
    alert?: AlertScope

    onHome = Scope.ASYNC_ACTION
    onOpenTodos = Scope.ASYNC_ACTION
    onOpenSuscriptions = Scope.ASYNC_ACTION
    onLogin = Scope.ASYNC_ACTION
}

export class MainPresenter extends ApplicationPresenter<MainScope> {

    // :: Instance

    private readonly bodyScope = new BodyScope()
    private readonly bodySlot = this.setBodySlot.bind(this)
    private readonly dialogSlot = this.setDialogSlot.bind(this)

    private stopServices = NOOP_PROMISE_VOID

    public constructor(historyManager: HistoryManager) {
        super(historyManager, new MainScope())

        // Important to allow newUriFromString to work properly
        this.setPlaces(buildCube())
    }

    public override release() {
        this.stopServices().catch(() => void 0)
        super.release()
    }

    public override async applyParameters(uri: PlaceUri, initialization: boolean, last?: boolean): Promise<boolean> {
        if (initialization) {
            await this.intializeState()

            try {
                const targetUri = this.newUriFromString(this.historyManager.location)
                if (targetUri.toString() !== uri.toString()) {
                    await this.flipToUri(targetUri)
                    return false
                }
            } catch (caught) {
                this.unexpected('Navigation from history', caught)
            }

            return true
        }

        if (last) {
            this.bodySlot(undefined)
        } else {
            uri.setScopeSlot(AttrIds.parentSlot, this.bodySlot)
            uri.setScopeSlot(AttrIds.dialogSlot, this.dialogSlot)
        }

        if (this.scope.alert) {
            await this.scope.alert.onClose()
            this.scope.alert = undefined
            this.update()
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
        this.scope.alert = alertScope
        this.update()
    }

    // :: View Actions

    protected async setBodySlot(scope?: Scope) {
        const scopeOrDefault = scope ?? this.bodyScope
        if (this.scope.body !== scopeOrDefault) {
            this.scope.body = scopeOrDefault
            this.update()
        }
    }

    protected async setDialogSlot(scope?: Scope) {
        if (this.scope.dialog !== scope) {
            this.scope.dialog = scope as IDialogScope
            this.update()

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