import { Observable, observe, Scope } from 'wdc-cube'

@Observable
export class SignInScope extends Scope {
    /** Who the demo offers to sign in as, so nobody has to invent a password. */
    @observe() suggestions: string[] = []

    @observe() name = ''
    @observe() busy = false
    @observe() error?: string

    onNameChanged = Scope.SYNC_ACTION_STRING
    onSignIn = Scope.ASYNC_ACTION
}
