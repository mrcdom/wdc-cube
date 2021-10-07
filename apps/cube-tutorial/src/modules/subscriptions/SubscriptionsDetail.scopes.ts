import { Scope } from 'wdc-cube'

export class SubscriptionsDetailScope extends Scope {
    email?: string

    // Actions
    onClose = Scope.ASYNC_ACTION
    onSubscribe = Scope.ASYNC_ACTION
    onEmailChanged = Scope.SYNC_ACTION_STRING
}