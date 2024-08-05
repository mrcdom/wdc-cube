import { type AlertSeverity, Observable, observe, Scope } from 'wdc-cube'

export type IDialogScope = Scope & { onClose: () => Promise<void> }

@Observable
export class AlertScope extends Scope {
    @observe() severity: AlertSeverity = 'info'
    @observe() title?: string
    @observe() message?: string

    onClose = Scope.ASYNC_ACTION
}

@Observable
export class BodyScope extends Scope {
    onOpenAlert = Scope.ASYNC_ACTION_ONE<AlertSeverity>()
}

@Observable
export class MainScope extends Scope {
    @observe() body?: Scope
    @observe() dialog?: IDialogScope
    @observe() alert?: AlertScope

    onHome = Scope.ASYNC_ACTION
    onOpenTodos = Scope.ASYNC_ACTION
    onOpenSuscriptions = Scope.ASYNC_ACTION
    onLogin = Scope.ASYNC_ACTION
}
