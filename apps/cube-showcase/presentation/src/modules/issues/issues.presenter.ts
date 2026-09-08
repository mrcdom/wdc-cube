import { CubePresenter, FlipIntent, Logger, NOOP_VOID, ScopeSlot } from 'wdc-cube'

import {
    ISSUE_PRIORITIES,
    ISSUE_STATES,
    PRIORITY_LABELS,
    STATE_LABELS,
    type Id,
    type Issue,
    type IssuePriority,
    type IssueState,
    type Member
} from '../../domain'
import { ShowcaseService } from '../../services'
import type { MainPresenter } from '../main/main.presenter'
import type { ProjectPresenter } from '../project/project.presenter'
import { IssueDetailKeys } from './issue-detail.key'
import { IssuesKeys, type IssueView } from './issues.key'
import { BoardColumnScope, FilterOptionScope, FilterScope, IssueRowScope, IssuesScope } from './issues.scope'

const LOG = Logger.get('Showcase.IssuesPresenter')

// @Inject
const service = ShowcaseService.INSTANCE

/**
 * The issue list, and the showcase's central argument.
 *
 * Everything the reader can change here — the filters, the page, whether they
 * are looking at a list or a board — is a parameter of this place. Changing one
 * is a navigation, so the address bar follows without being told, Back undoes
 * it, and a reload lands exactly where it was. `applyParameters` is where that
 * happens, and it is the only place that reads them.
 */
export class IssuesPresenter extends CubePresenter<MainPresenter, IssuesScope> {
    private parentSlot: ScopeSlot = NOOP_VOID
    private dialogSlot: ScopeSlot = NOOP_VOID

    private owner?: ProjectPresenter

    /**
     * Where this presenter currently is.
     *
     * Held here rather than read back out of the scope, because it is what
     * `publishParameters` hands to the address bar: the URL is derived from
     * this, and this is what a navigation set.
     */
    private at = {
        projectId: undefined as Id | undefined,
        view: 'list' as IssueView,
        state: undefined as IssueState | undefined,
        priority: undefined as IssuePriority | undefined,
        assigneeId: undefined as Id | undefined,
        cycleId: undefined as Id | undefined,
        search: undefined as string | undefined,
        sort: undefined as string | undefined,
        page: 1
    }

    /** The last query answered, so an identical re-entry does not refetch. */
    private lastQuery?: string

    public constructor(app: MainPresenter) {
        super(app, new IssuesScope())
    }

    public override async applyParameters(
        intent: FlipIntent,
        initialization: boolean,
        last?: boolean
    ): Promise<boolean> {
        const keys = new IssuesKeys(this.app, intent)

        if (!keys.projectId) {
            LOG.error('Reached the issue list without a project')
            return false
        }

        if (initialization) {
            this.parentSlot = keys.parentSlot
            this.dialogSlot = keys.dialogSlot
            this.owner = keys.owner
            this.bindActions()
        }

        const movedProject = this.at.projectId !== keys.projectId
        if (movedProject) {
            this.at.projectId = keys.projectId
            this.scope.loading = true
        }

        if (last) {
            // Nothing deeper is open, so whatever the dialog held is gone.
            this.dialogSlot(undefined)
        }

        // The slot first, and the requests after. Awaiting them before handing
        // the scope over leaves the previous page frozen for as long as the
        // network takes, which is what makes a fast application feel slow: the
        // `loading` flag exists so a view can be drawn before its data, and
        // filling the slot last is what made it unreachable.
        this.parentSlot(this.scope)

        await this.applyQuery(keys)

        return true
    }

    private bindActions() {
        this.scope.onShowList = this.action(this.onShowView.bind(this, 'list'))
        this.scope.onShowBoard = this.action(this.onShowView.bind(this, 'board'))
        this.scope.onShowTable = this.action(this.onShowView.bind(this, 'table'))
        this.scope.onSort = this.action(this.onSort) as unknown as (field: string) => void
        this.scope.onSearchChanged = this.handleSearchChanged.bind(this)
        this.scope.onSearchSubmitted = this.action(this.onSearchSubmitted)
        this.scope.onClearFilters = this.action(this.onClearFilters)
        this.scope.onPreviousPage = this.action(this.onMovePage.bind(this, -1))
        this.scope.onNextPage = this.action(this.onMovePage.bind(this, 1))
    }

    /** Everyone an issue can be assigned to, which `project` already asked for. */
    private get members(): Member[] {
        return this.owner?.members ?? []
    }

    private async applyQuery(keys: IssuesKeys) {
        this.at = {
            projectId: keys.projectId,
            view: keys.view,
            state: keys.state,
            priority: keys.priority,
            assigneeId: keys.assigneeId,
            cycleId: keys.cycleId,
            search: keys.search,
            sort: keys.sort,
            page: keys.page
        }

        this.scope.view = this.at.view
        this.scope.sortField = (this.at.sort ?? '').replace('-', '')
        this.scope.sortDescending = (this.at.sort ?? '').startsWith('-')
        this.scope.search = this.at.search ?? ''
        this.buildFilters(keys)

        const query = {
            state: this.at.state,
            priority: this.at.priority,
            assigneeId: this.at.assigneeId,
            cycleId: this.at.cycleId,
            search: this.at.search,
            sort: this.at.sort,
            page: this.at.page,
            perPage: this.scope.perPage
        }

        const signature = JSON.stringify([this.at.projectId, query])
        if (signature === this.lastQuery) {
            // Only the drawing changed, and the rows are already here. Refetching
            // to switch between a list and a board would be work the reader can
            // see and did not ask for.
            return
        }
        this.lastQuery = signature

        this.scope.loading = true
        this.scope.error = undefined

        try {
            const [, page] = await Promise.all([
                // The people name the assignees on every row and fill the
                // assignee filter. They are already in flight, asked for by the
                // place this one stands inside, so this joins that request.
                this.owner?.whenLoaded(),
                service.fetchIssues(this.at.projectId!, query)
            ])

            // Said again now that the people are here: the assignee filter has
            // names to offer, and the rows have someone to name.
            this.buildFilters(keys)

            this.scope.rows = page.items.map((issue) => this.buildRow(issue))
            this.scope.columns = this.buildColumns(this.scope.rows)
            this.scope.page = page.page
            this.scope.total = page.total
        } catch (caught) {
            this.scope.error = caught instanceof Error ? caught.message : 'Could not load the issues.'
            this.scope.rows = []
            this.scope.columns = []
        } finally {
            this.scope.loading = false
        }
    }

    private buildRow(issue: Issue): IssueRowScope {
        const assignee = this.members.find((member) => member.id === issue.assigneeId)

        const scope = new IssueRowScope()
        // The issue's own id, so a row survives a reload of the same page.
        scope.identity = issue.id
        scope.issueId = issue.id
        scope.reference = issue.reference
        scope.title = issue.title
        scope.state = issue.state
        scope.priority = issue.priority
        scope.assigneeName = assignee?.name
        scope.assigneeInitials = assignee?.initials
        scope.assigneeHue = assignee?.hue ?? 0
        scope.labels = issue.labels
        scope.updatedAt = issue.updatedAt
        scope.onOpen = this.action(this.onOpenIssue.bind(this, issue))
        scope.update = this.update
        return scope
    }

    /**
     * The board, from the rows the list already has.
     *
     * Two arrangements of one set of scopes — which is the same idea this
     * repository makes at a larger scale, where four renderers arrange one
     * presentation layer.
     */
    private buildColumns(rows: IssueRowScope[]): BoardColumnScope[] {
        return ISSUE_STATES.map((state) => {
            const column = new BoardColumnScope()
            column.identity = state
            column.state = state
            column.label = STATE_LABELS[state]
            column.issues = rows.filter((row) => row.state === state)
            column.onReceive = this.action(this.onMoveIssue.bind(this, state)) as unknown as (id: string) => void
            column.update = this.update
            return column
        })
    }

    private buildFilters(keys: IssuesKeys) {
        const filters = [
            this.buildFilter(
                'Status',
                keys.state,
                ISSUE_STATES,
                (value) => STATE_LABELS[value],
                (next) => {
                    const target = this.here()
                    target.state = next as IssueState | undefined
                    target.page = 1
                    return target
                }
            ),
            this.buildFilter(
                'Priority',
                keys.priority,
                ISSUE_PRIORITIES,
                (value) => PRIORITY_LABELS[value],
                (next) => {
                    const target = this.here()
                    target.priority = next as IssuePriority | undefined
                    target.page = 1
                    return target
                }
            ),
            this.buildFilter(
                'Assignee',
                keys.assigneeId,
                this.members.map((member) => member.id),
                (value) => this.members.find((member) => member.id === value)?.name ?? value,
                (next) => {
                    const target = this.here()
                    target.assigneeId = next
                    target.page = 1
                    return target
                }
            )
        ]

        this.scope.filters = filters
        this.scope.anyFilterActive =
            filters.some((filter) => filter.active) || !!keys.search || keys.page > 1 || !!keys.cycleId
    }

    private buildFilter<T extends string>(
        label: string,
        current: T | undefined,
        values: readonly T[],
        labelOf: (value: T) => string,
        target: (next: string | undefined) => IssuesKeys
    ): FilterScope {
        const filter = new FilterScope()
        filter.identity = label
        filter.label = label
        filter.active = current !== undefined
        filter.summary = current === undefined ? label : labelOf(current)
        filter.update = this.update

        const option = (optionLabel: string, value: string | undefined) => {
            const scope = new FilterOptionScope()
            scope.identity = `${label}:${value ?? ''}`
            scope.label = optionLabel
            scope.value = value
            scope.current = value === current
            scope.onSelect = this.action(async () => {
                await target(value).flip()
            })
            scope.update = this.update
            return scope
        }

        filter.options = [option(`Any ${label.toLowerCase()}`, undefined), ...values.map((v) => option(labelOf(v), v))]
        return filter
    }

    /** A fresh intent standing where this presenter stands. */
    private here(): IssuesKeys {
        const target = new IssuesKeys(this.app)
        target.projectId = this.at.projectId
        target.view = this.at.view
        target.state = this.at.state
        target.priority = this.at.priority
        target.assigneeId = this.at.assigneeId
        target.cycleId = this.at.cycleId
        target.search = this.at.search
        target.sort = this.at.sort
        target.page = this.at.page
        return target
    }

    /**
     * What the address bar says while this place is open.
     *
     * The framework asks every live presenter this whenever the URL is written,
     * so the address is *derived* from where the application is rather than
     * assembled by whoever navigated. Which is why a filter, a page and the
     * chosen view are in the link without a line anywhere putting them there.
     */
    public override publishParameters(intent: FlipIntent): void {
        const keys = new IssuesKeys(this.app, intent)
        keys.view = this.at.view
        keys.state = this.at.state
        keys.priority = this.at.priority
        keys.assigneeId = this.at.assigneeId
        keys.cycleId = this.at.cycleId
        keys.search = this.at.search
        keys.sort = this.at.sort
        keys.page = this.at.page
    }

    // ========== ACTIONS ==========

    protected handleSearchChanged(value: string) {
        // Mirrored without an update: a redraw per keystroke would take the caret
        // with it, and the search only becomes a place when it is submitted.
        this.scope.search = value
    }

    protected async onSearchSubmitted() {
        const target = this.here()
        target.search = this.scope.search || undefined
        target.page = 1
        await target.flip()
    }

    protected async onShowView(view: IssueView) {
        const target = this.here()
        target.view = view
        await target.flip()
    }

    protected async onClearFilters() {
        const target = new IssuesKeys(this.app)
        target.projectId = this.at.projectId
        target.view = this.at.view
        await target.flip()
    }

    protected async onMovePage(delta: number) {
        const page = Math.min(Math.max(1, this.at.page + delta), this.scope.pageCount)
        if (page === this.at.page) {
            return
        }
        const target = this.here()
        target.page = page
        await target.flip()
    }

    /**
     * An issue dropped on a column.
     *
     * The row moves before the request is answered and moves back if it fails.
     * That is not decoration: the board is the one screen where the reader's
     * hand is already committed, and a card that hangs where it was until the
     * network agrees reads as a bug.
     */
    protected async onMoveIssue(state: IssueState, issueId: string) {
        const row = this.scope.rows.find((candidate) => candidate.issueId === issueId)
        if (!row || row.state === state) {
            return
        }

        const previous = row.state
        row.state = state
        row.moving = true
        this.scope.columns = this.buildColumns(this.scope.rows)

        try {
            await service.updateIssue(issueId, { state })
        } catch (caught) {
            row.state = previous
            this.scope.columns = this.buildColumns(this.scope.rows)
            this.app.unexpected('Moving the issue', caught)
        } finally {
            row.moving = false
        }
    }

    /**
     * Ordering, which is a navigation like every other decision here.
     *
     * The table below is a third-party library that would happily keep this
     * state itself. It is told not to: the sort is a parameter of the place, so
     * a sorted table is a link, survives a reload, and Back undoes it.
     */
    protected async onSort(field: string) {
        const current = this.at.sort
        const target = this.here()
        target.sort = current === field ? `-${field}` : current === `-${field}` ? undefined : field
        target.page = 1
        await target.flip()
    }

    protected async onOpenIssue(issue: Issue) {
        const target = new IssueDetailKeys(this.app)
        target.projectId = this.at.projectId
        target.issueId = issue.id
        target.issue = issue
        await target.flip()
    }
}
