import { type AlertSeverity, Observable, observe, Scope } from 'wdc-cube'

import type { Member } from '../../domain'

export type IDialogScope = Scope & { onClose: () => Promise<void> }

@Observable
export class AlertScope extends Scope {
    @observe() severity: AlertSeverity = 'info'
    @observe() title?: string
    @observe() message?: string

    onClose = Scope.ASYNC_ACTION
}

/** One entry in the sidebar, and whether the reader is standing on it. */
@Observable
export class NavItemScope extends Scope {
    @observe() label = ''
    @observe() icon = ''
    @observe() current = false

    onSelect = Scope.ASYNC_ACTION
}

@Observable
export class MainScope extends Scope {
    @observe() signedIn = false
    @observe() member?: Member

    /** What the sidebar offers. Empty until there is a project to offer it for. */
    @observe() navigation: NavItemScope[] = []

    @observe() projectName?: string

    @observe() body?: Scope
    @observe() dialog?: IDialogScope
    @observe() alert?: AlertScope

    onSignOut = Scope.ASYNC_ACTION
    onOpenProjects = Scope.ASYNC_ACTION
}
