import {
    Logger,
    Application,
    HistoryManager,
    PlaceUri,
    Scope,
    ScopeSlot,
    AlertSeverity
} from 'wdc-cube'
import { Places } from '../Places'
import { ViewIds, AttrsIds } from '../Constants'
import { startServices } from '../services'

const LOG = Logger.get('MainPresenter')

type IDialogScope = Scope & { onClose: () => Promise<void> }

export class AlertScope extends Scope {
    severity: AlertSeverity = 'info'
    title?: string
    message?: string

    onClose = Scope.ACTION()
}

export class BodyScope extends Scope {
    onOpenAlert = Scope.ACTION1<AlertSeverity>()
}

export class MainScope extends Scope {
    body?: Scope
    dialog?: IDialogScope
    alert?: AlertScope

    onHome = Scope.ACTION()
    onOpenTodos = Scope.ACTION()
    onOpenSuscriptions = Scope.ACTION()
}

export class MainPresenter extends Application {

    // :: Class Methods

    public static create(historyManager: HistoryManager) {
        const app = new MainPresenter(Places.root, historyManager)
        app.catalogPlaces(Places)
        return app
    }

    // :: Instance

    public readonly scope = new MainScope(ViewIds.main);

    private readonly bodyScope = new BodyScope(ViewIds.mainBody)

    protected readonly bodySlot: ScopeSlot = scope => {
        if (this.scope.body !== scope) {
            this.scope.body = scope || this.bodyScope
            this.update(this.scope)
        }
    }

    protected readonly dialogSlot: ScopeSlot = scope => {
        if (this.scope.dialog !== scope) {
            this.scope.dialog = scope as IDialogScope

            if (this.scope.dialog && !this.scope.dialog.onClose) {
                LOG.error(`Missing onClose action on scope ${this.scope.dialog.vid}`)
            }

            this.update(this.scope)
        }
    }

    public override async applyParameters(uri: PlaceUri, initialization: boolean, depeest?: boolean): Promise<boolean> {
        if (initialization) {
            await startServices()

            this.scope.onHome = this.onHome.bind(this)
            this.scope.onOpenTodos = this.onOpenTodos.bind(this)
            this.scope.onOpenSuscriptions = this.onOpenSuscriptions.bind(this)

            this.bodyScope.onOpenAlert = this.onOpenAlert.bind(this)

            this.scope.body = this.bodyScope

            try {
                const targetUri = this.newUriFromString(this.historyManager.location)
                if (targetUri.toString() !== uri.toString()) {
                    await this.flipToUri(targetUri)
                    return false
                }
            } catch (caught) {
                this.unexpected('Navigation from history', caught)
            }

            LOG.info('Initialized')
        }

        if (depeest) {
            this.bodySlot(undefined)
        } else {
            uri.setScopeSlot(AttrsIds.parentSlot, this.bodySlot)
            uri.setScopeSlot(AttrsIds.dialogSlot, this.dialogSlot)
        }

        if (this.scope.alert) {
            await this.scope.alert.onClose()
            this.scope.alert = undefined
            this.update(this.scope)
        }

        return true
    }

    // :: Helper API

    public override unexpected(message: string, error: unknown) {
        super.unexpected(message, error)
        this.alert('error', 'Unexpected error', message)
    }

    public override alert(severity: AlertSeverity, title: string, message: string, onClose?: () => Promise<void>) {
        const alertScope = new AlertScope(ViewIds.mainAlert)
        alertScope.severity = severity
        alertScope.title = title
        alertScope.message = message
        alertScope.onClose = async () => {
            this.scope.alert = undefined
            this.update(this.scope)
            if (onClose) {
                await onClose()
            }
        }

        this.scope.alert = alertScope
        this.update(this.scope)
    }

    // :: View Actions

    protected async onHome() {
        try {
            await this.flip(Places.root)
        } catch (caught) {
            this.unexpected('Opening to root', caught)
        } finally {
            this.update(this.scope)
        }
    }

    protected async onOpenTodos() {
        try {
            await this.flip(Places.todos)
        } catch (caught) {
            this.unexpected('Opening to module-1', caught)
        } finally {
            this.update(this.scope)
        }
    }

    protected async onOpenSuscriptions() {
        try {
            await this.flip(Places.subscriptions)
        } catch (caught) {
            this.unexpected('Opening to module-2', caught)
        } finally {
            this.update(this.scope)
        }
    }

    protected async onOpenAlert(severity: AlertSeverity) {
        try {
            LOG.info('onAlert clicked')
            this.alert(severity, 'Some title', 'Some message', async () => {
                LOG.info(`Alert with severity ${severity} was closed`)
            })
        } catch (caught) {
            LOG.error('onAlert', caught)
        } finally {
            this.update(this.scope)
        }
    }
}