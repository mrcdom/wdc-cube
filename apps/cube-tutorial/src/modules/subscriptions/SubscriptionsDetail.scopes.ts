import { Observable, observe, Scope } from 'wdc-cube'

@Observable
export class SubscriptionsDetailScope extends Scope {
    @observe() email?: string

    // Actions
    onClose = Scope.ASYNC_ACTION
    onSubscribe = Scope.ASYNC_ACTION
    onEmailChanged = Scope.SYNC_ACTION_STRING
}