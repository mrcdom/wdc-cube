import { Observable, observe, Scope } from 'wdc-cube'

import type { Id, IssuePriority, IssueState } from '../../domain'
import type { IssueView } from './issues.key'

/** One issue, wherever it is drawn. The same scope fills a row and a card. */
@Observable
export class IssueRowScope extends Scope {
    @observe() reference = ''
    @observe() title = ''
    @observe() state: IssueState = 'backlog'
    @observe() priority: IssuePriority = 'none'
    @observe() assigneeName?: string
    @observe() assigneeInitials?: string
    @observe() assigneeHue = 0
    @observe() labels: string[] = []
    @observe() updatedAt = ''

    onOpen = Scope.ASYNC_ACTION
}

/** One column of the board: a state, and the issues in it. */
@Observable
export class BoardColumnScope extends Scope {
    @observe() state: IssueState = 'backlog'
    @observe() label = ''
    @observe() issues: IssueRowScope[] = []
}

/** One choice a filter offers, and whether it is the one in force. */
@Observable
export class FilterOptionScope extends Scope {
    @observe() label = ''
    @observe() value?: string
    @observe() current = false

    onSelect = Scope.ASYNC_ACTION
}

@Observable
export class FilterScope extends Scope {
    @observe() label = ''
    @observe() summary = ''
    @observe() active = false
    @observe() options: FilterOptionScope[] = []
}

@Observable
export class IssuesScope extends Scope {
    @observe() loading = true
    @observe() error?: string

    @observe() projectName = ''
    @observe() projectKey = ''

    /**
     * Which drawing is on screen. Both are built from the same rows: the list
     * and the board differ in arrangement, not in what they are arranging.
     */
    @observe() view: IssueView = 'list'
    @observe() rows: IssueRowScope[] = []
    @observe() columns: BoardColumnScope[] = []

    @observe() filters: FilterScope[] = []
    @observe() search = ''
    @observe() anyFilterActive = false

    @observe() page = 1
    @observe() perPage = 25
    @observe() total = 0

    onShowList = Scope.ASYNC_ACTION
    onShowBoard = Scope.ASYNC_ACTION
    onSearchChanged = Scope.SYNC_ACTION_STRING
    onSearchSubmitted = Scope.ASYNC_ACTION
    onClearFilters = Scope.ASYNC_ACTION
    onPreviousPage = Scope.ASYNC_ACTION
    onNextPage = Scope.ASYNC_ACTION

    public get pageCount(): number {
        return Math.max(1, Math.ceil(this.total / Math.max(1, this.perPage)))
    }
}

export type { Id, IssueState, IssuePriority, IssueView }
