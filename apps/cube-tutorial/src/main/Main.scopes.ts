import { Scope, AlertSeverity } from 'wdc-cube'

export type IDialogScope = Scope & { onClose: () => Promise<void> }

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