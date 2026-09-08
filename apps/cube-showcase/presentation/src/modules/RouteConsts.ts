import { Place } from 'wdc-cube'

/**
 * Every piece of state a reader can arrive at by URL.
 *
 * This list is the showcase's central claim made concrete: a filter, a page, a
 * chosen view and an open issue are all *places the reader is*, not hidden
 * component state — so a link carries them, a reload restores them, and Back
 * undoes them, without a line written to make any of that happen.
 */
export const ParamIds = {
    ProjectId: 'project',
    IssueId: 'issue',

    /** Which drawing of the same issue list: `list` or `board`. */
    View: 'view',

    State: 'state',
    Priority: 'priority',
    AssigneeId: 'assignee',
    CycleId: 'cycle',
    Search: 'q',
    Page: 'page'
}

export const AttrIds = {
    parentSlot: 'parent-slot',
    dialogSlot: 'dialog-slot',

    /** A record already in hand, so opening it does not fetch it again. */
    issueDetail_issue: '0001'
}

export const Places = {
    main: Place.ROOT,
    signIn: Place.UNKNOWN,
    projects: Place.UNKNOWN,
    issues: Place.UNKNOWN,
    issueDetail: Place.UNKNOWN,
    cycles: Place.UNKNOWN
}
