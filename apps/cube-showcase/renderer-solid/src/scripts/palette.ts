import type { IssuePriority, IssueState } from 'wdc-cube-showcase-presentation/domain'

/**
 * What a status and a priority look like.
 *
 * The presentation layer deals in concepts: a bar knows it counts `done`, a
 * slice knows it counts `urgent`. What colour those are is a decision about
 * appearance, so it is made here — once, for every screen that draws them, and
 * again from scratch by whatever renderer comes next.
 *
 * These five hexadecimals used to exist twice, identically: here and in the
 * dashboard's presenter. That is the shape the mistake takes — not a wrong
 * colour, but the same appearance decided in two layers, where the copy behind
 * the boundary is the one no other renderer can disagree with.
 */
export function stateColour(state: IssueState): string {
    return {
        backlog: '#9a9aa6',
        todo: '#6b7280',
        'in-progress': '#d97706',
        done: '#16a34a',
        cancelled: '#c026d3'
    }[state]
}

export function priorityColour(priority: IssuePriority): string {
    return {
        urgent: '#dc2626',
        high: '#ea580c',
        medium: '#ca8a04',
        low: '#0891b2',
        none: '#c9c9d2'
    }[priority]
}

/** An unfilled step on a priority mark. */
export const PRIORITY_EMPTY = '#e4e4ea'
