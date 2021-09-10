import {
    Logger, ILogger,
    Application,
    HistoryManager,
    PlaceUri,
    Scope,
    ScopeSlot,
    NOOP_PROMISE_VOID
} from 'wdc-cube'
import { Places } from '../Places'
import { ViewIds, AttrsIds } from '../Constants'
import { startServices } from '../services'

const LOG = Logger.get('MainPresenter')

type IDialogScope = Scope & { onClose: () => Promise<void> }

type AlertSeverity = 'error' | 'success' | 'info' | 'warning'

export class AlertScope extends Scope {
    severity: AlertSeverity = 'info'
    title?: string
    message?: string

    onClose: () => Promise<void> = NOOP_PROMISE_VOID
}

export class BodyScope extends Scope {
    onAlert: (severity: AlertSeverity) => Promise<void> = NOOP_PROMISE_VOID
}

export class MainScope extends Scope {
    body?: Scope
    dialog?: IDialogScope
    alert?: AlertScope

    onRoot: () => Promise<void> = NOOP_PROMISE_VOID
    onModule1: () => Promise<void> = NOOP_PROMISE_VOID
    onModule2: () => Promise<void> = NOOP_PROMISE_VOID
    onModule1Detail: () => Promise<void> = NOOP_PROMISE_VOID
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
            this.scope.update()
        }
    }

    protected readonly dialogSlot: ScopeSlot = scope => {
        if (this.scope.dialog !== scope) {
            this.scope.dialog = scope as IDialogScope

            if (this.scope.dialog && !this.scope.dialog.onClose) {
                LOG.error(`Missing onClose action on scope ${this.scope.dialog.id}`)
            }

            this.scope.update()
        }
    }



    public override async applyParameters(uri: PlaceUri, initialization: boolean, deepest: boolean): Promise<boolean> {
        if (initialization) {
            await startServices()

            this.scope.bind(this)
            this.bodyScope.bind(this)
            this.scope.body = this.bodyScope

            try {
                await this.navigate(this.historyManager.location)
            } catch(caught) {
                this.unexpected(LOG, 'Navigation from history', caught)
            }

            LOG.info('Initialized')
        }

        if (deepest) {
            this.bodySlot(undefined)
        } else {
            uri.setScopeSlot(AttrsIds.parentSlot, this.bodySlot)
            uri.setScopeSlot(AttrsIds.dialogSlot, this.dialogSlot)
        }

        if (this.scope.alert) {
            await this.scope.alert.onClose()
            this.scope.alert = undefined
        }

        return true
    }

    // :: Helper API

    public unexpected(log: ILogger, message: string, error: unknown) {
        log.error(message, error)
        this.alert('error', 'Unexpected error', message)
    }

    public alert(severity: AlertSeverity, title: string, message: string, onClose?: () => Promise<void>) {
        const alertScope = new AlertScope(ViewIds.alert)
        alertScope.severity = severity
        alertScope.title = title
        alertScope.message = message
        alertScope.onClose = async () => {
            this.scope.alert = undefined
            this.scope.update()
            if (onClose) {
                await onClose()
            }
        }

        this.scope.alert = alertScope
        this.scope.update()
    }

    // :: View Actions

    protected async onRoot() {
        try {
            await this.go(Places.root)
        } catch (caught) {
            this.unexpected(LOG, 'Opening to root', caught)
        } finally {
            this.scope.update()
        }
    }

    protected async onModule1() {
        try {
            await this.go(Places.module1)
        } catch (caught) {
            this.unexpected(LOG, 'Opening to module-1', caught)
        } finally {
            this.scope.update()
        }
    }

    protected async onModule1Detail() {
        try {
            await this.go(Places.module1Detail)
        } catch (caught) {
            this.unexpected(LOG, 'Opening to module-1/detail', caught)
        } finally {
            this.scope.update()
        }
    }

    protected async onModule2() {
        try {
            await this.go(Places.module2)
        } catch (caught) {
            this.unexpected(LOG, 'Opening to module-2', caught)
        } finally {
            this.scope.update()
        }
    }

    protected async onAlert(severity: AlertSeverity) {
        try {
            LOG.info('onAlert clicked')
            this.alert(severity, 'Some title', 'Some message', async () => {
                LOG.info(`Alert with severity ${severity} was closed`)
            })
        } catch (caught) {
            LOG.error('onAlert', caught)
        } finally {
            this.scope.update()
        }
    }
}