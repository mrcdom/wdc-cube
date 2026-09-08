import { Observable, observe, Scope } from 'wdc-cube'

@Observable
export class SubscriptionsDetailScope extends Scope {
    /** The site being subscribed to. Shown; never typed into. */
    @observe() site?: string

    /** What the reader typed. Empty until they do. */
    @observe() email?: string

    // Actions
    onClose = Scope.ASYNC_ACTION
    onSubscribe = Scope.ASYNC_ACTION
    onEmailChanged = Scope.SYNC_ACTION_STRING
}
