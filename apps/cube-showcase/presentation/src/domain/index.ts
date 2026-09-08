/**
 * What the showcase is about, in the shape the API speaks.
 *
 * Nothing here is a scope: these are the records the service hands over, and a
 * presenter turns them into scopes. Keeping the two apart is what lets the
 * service be swapped for a real server without a view noticing.
 */

export type Id = string

export type Member = {
    id: Id
    name: string
    initials: string
    /** A hue, so an avatar can be drawn without an image to load. */
    hue: number
}

export type Project = {
    id: Id
    /** The short prefix an issue is numbered under: WEB-14. */
    key: string
    name: string
    description: string
    hue: number
    leadId: Id
    issueCount: number
}

export const ISSUE_STATES = ['backlog', 'todo', 'in-progress', 'done', 'cancelled'] as const
export type IssueState = (typeof ISSUE_STATES)[number]

export const ISSUE_PRIORITIES = ['urgent', 'high', 'medium', 'low', 'none'] as const
export type IssuePriority = (typeof ISSUE_PRIORITIES)[number]

export type Issue = {
    id: Id
    projectId: Id
    /** `WEB-14`, which is what a person calls it. */
    reference: string
    title: string
    description: string
    state: IssueState
    priority: IssuePriority
    assigneeId?: Id
    cycleId?: Id
    labels: string[]
    createdAt: string
    updatedAt: string
}

export type Cycle = {
    id: Id
    projectId: Id
    name: string
    startsAt: string
    endsAt: string
}

export type Session = {
    member: Member
}

/** What a list can be ordered by. A minus in the URL means descending. */
export const ISSUE_SORTS = ['reference', 'title', 'state', 'priority', 'updatedAt'] as const
export type IssueSort = (typeof ISSUE_SORTS)[number]

export const SORT_LABELS: Record<IssueSort, string> = {
    reference: 'ID',
    title: 'Title',
    state: 'Status',
    priority: 'Priority',
    updatedAt: 'Updated'
}

/** What a list request asks for, and what every one of these is in the URL. */
export type IssueQuery = {
    sort?: string
    state?: IssueState
    priority?: IssuePriority
    assigneeId?: Id
    cycleId?: Id
    search?: string
    page?: number
    perPage?: number
}

/** What a list request answers, which a view needs in order to page. */
export type Page<T> = {
    items: T[]
    page: number
    perPage: number
    total: number
}

export const STATE_LABELS: Record<IssueState, string> = {
    backlog: 'Backlog',
    todo: 'Todo',
    'in-progress': 'In progress',
    done: 'Done',
    cancelled: 'Cancelled'
}

export const PRIORITY_LABELS: Record<IssuePriority, string> = {
    urgent: 'Urgent',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    none: 'None'
}
