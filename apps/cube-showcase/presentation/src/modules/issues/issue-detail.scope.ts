import { Observable, observe, Scope } from 'wdc-cube'

import type { IssuePriority, IssueState } from '../../domain'

@Observable
export class IssueDetailScope extends Scope {
    @observe() loading = true
    @observe() error?: string

    @observe() reference = ''
    @observe() title = ''
    @observe() description = ''
    @observe() state: IssueState = 'backlog'
    @observe() priority: IssuePriority = 'none'
    @observe() assigneeName?: string
    @observe() labels: string[] = []
    @observe() updatedAt = ''

    /** Saving a change to the state, so the control can say so. */
    @observe() saving = false

    onChangeState = Scope.SYNC_ACTION_STRING
    onChangePriority = Scope.SYNC_ACTION_STRING
    onClose = Scope.ASYNC_ACTION
}
