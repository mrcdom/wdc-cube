import { Observable, observe, Scope } from 'wdc-cube'

import type { IssuePriority, IssueState } from '../../domain'

/** One headline number, and how it moved. */
@Observable
export class StatScope extends Scope {
    @observe() label = ''
    @observe() value = 0
    @observe() hint = ''
    @observe() tone: 'plain' | 'good' | 'warn' = 'plain'
}

/**
 * One bar, already measured as a share of the largest.
 *
 * The share is arithmetic and belongs here; the status is a concept and belongs
 * here. What colour a status is drawn in belongs to whoever draws it, which is
 * why this says `done` and not `#16a34a`.
 */
@Observable
export class BarScope extends Scope {
    @observe() state: IssueState = 'backlog'
    @observe() label = ''
    @observe() value = 0
    @observe() share = 0

    /** Opens the issue list filtered to whatever this bar counts. */
    onOpen = Scope.ASYNC_ACTION
}

/**
 * One slice of the ring, with the arc already computed.
 *
 * The geometry is the presenter's, not the view's. A view that has to work out
 * an arc is a view holding a rule about the data, and the next renderer would
 * have to work it out again.
 */
@Observable
export class SliceScope extends Scope {
    @observe() priority: IssuePriority = 'none'
    @observe() label = ''
    @observe() value = 0
    @observe() share = 0
    @observe() offset = 0

    onOpen = Scope.ASYNC_ACTION
}

@Observable
export class PersonLoadScope extends Scope {
    @observe() name = ''
    @observe() initials = ''
    @observe() hue = 0
    @observe() open = 0
    @observe() share = 0

    onOpen = Scope.ASYNC_ACTION
}

@Observable
export class DashboardScope extends Scope {
    @observe() loading = true
    @observe() error?: string

    @observe() projectName = ''
    @observe() stats: StatScope[] = []
    @observe() byState: BarScope[] = []
    @observe() byPriority: SliceScope[] = []
    @observe() workload: PersonLoadScope[] = []
    @observe() completion = 0
}

export type { IssueState, IssuePriority }
