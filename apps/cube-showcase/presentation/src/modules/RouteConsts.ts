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

    /** Which drawing of the same issue list: `list`, `board` or `table`. */
    View: 'view',

    State: 'state',
    Priority: 'priority',
    AssigneeId: 'assignee',
    CycleId: 'cycle',
    Search: 'q',
    Sort: 'sort',
    Page: 'page'
}

export const AttrIds = {
    parentSlot: 'parent-slot',
    dialogSlot: 'dialog-slot',

    /** The presenter of the project a place is standing inside. */
    project_owner: '0001',

    /** A record already in hand, so opening it does not fetch it again. */
    issueDetail_issue: '0002'
}

export const Places = {
    main: Place.ROOT,
    signIn: Place.UNKNOWN,

    /**
     * The selected project — what the dashboard, the issues and the cycles are
     * all about, and where the session is checked once on behalf of all three.
     *
     * `projects` sits inside it rather than above it: choosing a different
     * project is a decision about which project is selected, so it belongs to
     * the place that owns that decision.
     */
    project: Place.UNKNOWN,
    projects: Place.UNKNOWN,
    issues: Place.UNKNOWN,
    issueDetail: Place.UNKNOWN,
    cycles: Place.UNKNOWN,
    dashboard: Place.UNKNOWN
}
