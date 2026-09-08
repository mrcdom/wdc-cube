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
import { IssuesKeys } from '../issues/issues.key'
import type { MainPresenter } from '../main/main.presenter'
import type { ProjectPresenter } from '../project/project.presenter'
import { DashboardKeys } from './dashboard.key'
import { BarScope, DashboardScope, PersonLoadScope, SliceScope, StatScope } from './dashboard.scope'

const LOG = Logger.get('Showcase.DashboardPresenter')

// @Inject
const service = ShowcaseService.INSTANCE

/**
 * A project at a glance.
 *
 * Every figure here is arithmetic over the issues, and it is done in the
 * presenter — including the geometry of the ring, which arrives as an arc rather
 * than as five numbers a view would have to turn into one. A chart that a view
 * computes is a rule about the data living in the drawing, and the next renderer
 * would have to work it out again.
 *
 * The line runs the other way for appearance. A bar says it counts `done` and a
 * slice says it counts `urgent`; what colour those are is not a fact about the
 * project, and a renderer that wanted a different palette — or none, in print —
 * could not have one if this file had already chosen.
 *
 * Every figure is also a link. Clicking a bar opens the issue list filtered to
 * exactly what the bar counts, which is only possible because that filter is a
 * place — the dashboard does not have to hand anything over, it just names where
 * to go.
 */
export class DashboardPresenter extends CubePresenter<MainPresenter, DashboardScope> {
    private parentSlot: ScopeSlot = NOOP_VOID
    private owner?: ProjectPresenter
    private projectId?: Id

    public constructor(app: MainPresenter) {
        super(app, new DashboardScope())
    }

    public override async applyParameters(intent: FlipIntent, initialization: boolean): Promise<boolean> {
        const keys = new DashboardKeys(this.app, intent)

        if (initialization) {
            this.parentSlot = keys.parentSlot
            this.owner = keys.owner
            LOG.info('Initialized')
        }

        const moved = this.projectId !== keys.projectId
        if (moved) {
            this.projectId = keys.projectId
            this.scope.loading = true
        }

        // The slot first, and the request after.
        //
        // Awaiting the data before handing the scope over leaves the previous
        // page on screen, frozen, for as long as the network takes — measured at
        // 315ms here, during which nothing at all moved. The scope has a
        // `loading` flag precisely so a view can be drawn before its data
        // exists; filling the slot last is what made that flag unreachable.
        this.parentSlot(this.scope)

        if (moved) {
            await this.load()
        }

        return true
    }

    private async load() {
        try {
            const [, page] = await Promise.all([
                // The project and its people are already in flight, asked for by
                // the place this one stands inside. Joining that request here
                // rather than waiting for it above is what keeps it alongside
                // this one instead of in front of it.
                this.owner?.whenLoaded(),
                // Everything, because these are figures about the project and not
                // about a page of it.
                service.fetchIssues(this.projectId!, { perPage: 1000 })
            ])

            this.scope.projectName = this.owner?.project?.name ?? ''
            this.build(page.items, this.owner?.members ?? [])
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
            scope.state = entry.state
            scope.label = STATE_LABELS[entry.state]
            scope.value = entry.value
            scope.share = Math.round((entry.value / tallest) * 100)
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
            scope.priority = priority
            scope.label = PRIORITY_LABELS[priority]
            scope.value = value
            scope.share = share
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
