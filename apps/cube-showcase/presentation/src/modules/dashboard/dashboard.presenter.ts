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
import { CyclesKeys } from '../cycles/cycles.key'
import { IssuesKeys } from '../issues/issues.key'
import type { MainPresenter } from '../main/main.presenter'
import { DashboardKeys } from './dashboard.key'
import { BarScope, DashboardScope, PersonLoadScope, SliceScope, StatScope } from './dashboard.scope'

const LOG = Logger.get('Showcase.DashboardPresenter')

// @Inject
const service = ShowcaseService.INSTANCE

const STATE_COLOURS: Record<IssueState, string> = {
    backlog: '#9a9aa6',
    todo: '#6b7280',
    'in-progress': '#d97706',
    done: '#16a34a',
    cancelled: '#c026d3'
}

const PRIORITY_COLOURS: Record<IssuePriority, string> = {
    urgent: '#dc2626',
    high: '#ea580c',
    medium: '#ca8a04',
    low: '#0891b2',
    none: '#c9c9d2'
}

/**
 * A project at a glance.
 *
 * Every figure here is arithmetic over the issues, and it is done in the
 * presenter — including the geometry of the ring, which arrives as an arc rather
 * than as five numbers a view would have to turn into one. A chart that a view
 * computes is a rule about the data living in the drawing, and the next renderer
 * would have to work it out again.
 *
 * Every figure is also a link. Clicking a bar opens the issue list filtered to
 * exactly what the bar counts, which is only possible because that filter is a
 * place — the dashboard does not have to hand anything over, it just names where
 * to go.
 */
export class DashboardPresenter extends CubePresenter<MainPresenter, DashboardScope> {
    private parentSlot: ScopeSlot = NOOP_VOID
    private projectId?: Id

    public constructor(app: MainPresenter) {
        super(app, new DashboardScope())
    }

    public override async applyParameters(intent: FlipIntent, initialization: boolean): Promise<boolean> {
        if (!this.app.authenticated) {
            await this.app.demandSignIn()
            return false
        }

        const keys = new DashboardKeys(this.app, intent)

        if (initialization) {
            this.parentSlot = keys.parentSlot
            LOG.info('Initialized')
        }

        if (this.projectId !== keys.projectId) {
            this.projectId = keys.projectId
            await this.load()
        }

        this.showNavigation()
        this.parentSlot(this.scope)
        return true
    }

    public override publishParameters(intent: FlipIntent): void {
        const keys = new DashboardKeys(this.app, intent)
        keys.projectId = this.projectId
    }

    private showNavigation() {
        const projectId = this.projectId
        const go =
            <K extends { projectId: Id | undefined; flip: () => Promise<void> }>(keys: K) =>
            async () => {
                keys.projectId = projectId
                await keys.flip()
            }

        this.app.setNavigation(this.scope.projectName, [
            this.app.buildNavItem('Dashboard', 'dashboard', true, async () => undefined),
            this.app.buildNavItem('Issues', 'issues', false, go(new IssuesKeys(this.app))),
            this.app.buildNavItem('Cycles', 'cycles', false, go(new CyclesKeys(this.app)))
        ])
    }

    private async load() {
        this.scope.loading = true
        this.update()

        try {
            const [project, members, page] = await Promise.all([
                service.fetchProject(this.projectId!),
                service.fetchMembers(),
                // Everything, because these are figures about the project and not
                // about a page of it.
                service.fetchIssues(this.projectId!, { perPage: 1000 })
            ])

            this.scope.projectName = project?.name ?? ''
            this.build(page.items, members)
            this.scope.error = undefined
        } catch (caught) {
            this.scope.error = caught instanceof Error ? caught.message : 'Could not load the dashboard.'
        } finally {
            this.scope.loading = false
        }
    }

    private build(issues: Issue[], members: Member[]) {
        const count = (predicate: (issue: Issue) => boolean) => issues.filter(predicate).length

        const done = count((issue) => issue.state === 'done')
        const closed = done + count((issue) => issue.state === 'cancelled')
        const open = issues.length - closed

        this.scope.completion = issues.length === 0 ? 0 : Math.round((done / issues.length) * 100)

        this.scope.stats = [
            this.stat('Open', open, `${issues.length} in total`),
            this.stat(
                'In progress',
                count((issue) => issue.state === 'in-progress'),
                'being worked on'
            ),
            this.stat(
                'Urgent',
                count((issue) => issue.priority === 'urgent' && issue.state !== 'done'),
                'still open',
                'warn'
            ),
            this.stat('Done', done, `${this.scope.completion}% of the project`, 'good')
        ]

        // ========== BY STATE ==========

        const byState = ISSUE_STATES.map((state) => ({ state, value: count((issue) => issue.state === state) }))
        const tallest = Math.max(1, ...byState.map((entry) => entry.value))

        this.scope.byState = byState.map((entry) => {
            const scope = new BarScope()
            scope.identity = entry.state
            scope.label = STATE_LABELS[entry.state]
            scope.value = entry.value
            scope.share = Math.round((entry.value / tallest) * 100)
            scope.colour = STATE_COLOURS[entry.state]
            scope.onOpen = this.action(this.openIssues.bind(this, { state: entry.state }))
            scope.update = this.update
            return scope
        })

        // ========== BY PRIORITY ==========

        const total = Math.max(1, issues.length)
        let offset = 0

        this.scope.byPriority = ISSUE_PRIORITIES.map((priority) => {
            const value = count((issue) => issue.priority === priority)
            const share = (value / total) * 100

            const scope = new SliceScope()
            scope.identity = priority
            scope.label = PRIORITY_LABELS[priority]
            scope.value = value
            scope.share = share
            scope.colour = PRIORITY_COLOURS[priority]
            // Where this slice starts, so the view draws an arc and works nothing out.
            scope.offset = offset
            scope.onOpen = this.action(this.openIssues.bind(this, { priority }))
            scope.update = this.update

            offset += share
            return scope
        }).filter((slice) => slice.value > 0)

        // ========== WHO IS CARRYING WHAT ==========

        const workload = members
            .map((member) => ({
                member,
                open: count(
                    (issue) => issue.assigneeId === member.id && issue.state !== 'done' && issue.state !== 'cancelled'
                )
            }))
            .filter((entry) => entry.open > 0)
            .sort((a, b) => b.open - a.open)

        const busiest = Math.max(1, ...workload.map((entry) => entry.open))

        this.scope.workload = workload.map((entry) => {
            const scope = new PersonLoadScope()
            scope.identity = entry.member.id
            scope.name = entry.member.name
            scope.initials = entry.member.initials
            scope.hue = entry.member.hue
            scope.open = entry.open
            scope.share = Math.round((entry.open / busiest) * 100)
            scope.onOpen = this.action(this.openIssues.bind(this, { assigneeId: entry.member.id }))
            scope.update = this.update
            return scope
        })
    }

    private stat(label: string, value: number, hint: string, tone: 'plain' | 'good' | 'warn' = 'plain'): StatScope {
        const scope = new StatScope()
        scope.identity = label
        scope.label = label
        scope.value = value
        scope.hint = hint
        scope.tone = tone
        scope.update = this.update
        return scope
    }

    /** Every figure on this page is a link into the list that explains it. */
    private async openIssues(filter: { state?: IssueState; priority?: IssuePriority; assigneeId?: Id }) {
        const keys = new IssuesKeys(this.app)
        keys.projectId = this.projectId
        keys.state = filter.state
        keys.priority = filter.priority
        keys.assigneeId = filter.assigneeId
        await keys.flip()
    }
}
