import { CubePresenter, FlipIntent, Logger, NOOP_VOID, ScopeSlot } from 'wdc-cube'

import type { Cycle, Id } from '../../domain'
import { ShowcaseService } from '../../services'
import { IssuesKeys } from '../issues/issues.key'
import type { MainPresenter } from '../main/main.presenter'
import { CyclesKeys } from './cycles.key'
import { CycleCardScope, CyclesScope } from './cycles.scope'

const LOG = Logger.get('Showcase.CyclesPresenter')

// @Inject
const service = ShowcaseService.INSTANCE

export class CyclesPresenter extends CubePresenter<MainPresenter, CyclesScope> {
    private parentSlot: ScopeSlot = NOOP_VOID
    private projectId?: Id

    public constructor(app: MainPresenter) {
        super(app, new CyclesScope())
    }

    public override async applyParameters(intent: FlipIntent, initialization: boolean): Promise<boolean> {
        const keys = new CyclesKeys(this.app, intent)

        if (initialization) {
            this.parentSlot = keys.parentSlot
            LOG.info('Initialized')
        }

        const moved = this.projectId !== keys.projectId
        if (moved) {
            this.projectId = keys.projectId
            this.scope.loading = true
        }

        // The slot first, so the skeleton is on screen while the request runs.
        this.parentSlot(this.scope)

        if (moved) {
            await this.load()
        }

        return true
    }

    private async load() {
        try {
            const [cycles, page] = await Promise.all([
                service.fetchCycles(this.projectId!),
                service.fetchIssues(this.projectId!, { perPage: 500 })
            ])

            const now = Date.now()

            this.scope.cycles = cycles.map((cycle) => {
                const inCycle = page.items.filter((issue) => issue.cycleId === cycle.id)
                return this.buildCard(
                    cycle,
                    inCycle.length,
                    inCycle.filter((issue) => issue.state === 'done').length,
                    now
                )
            })
            this.scope.error = undefined
        } catch (caught) {
            this.scope.error = caught instanceof Error ? caught.message : 'Could not load the cycles.'
        } finally {
            this.scope.loading = false
        }
    }

    private buildCard(cycle: Cycle, total: number, done: number, now: number): CycleCardScope {
        const projectId = this.projectId
        const scope = new CycleCardScope()
        scope.identity = cycle.id
        scope.name = cycle.name
        scope.startsAt = cycle.startsAt
        scope.endsAt = cycle.endsAt
        scope.total = total
        scope.done = done
        scope.active = Date.parse(cycle.startsAt) <= now && now <= Date.parse(cycle.endsAt)
        scope.onOpen = this.action(async () => {
            const keys = new IssuesKeys(this.app)
            keys.projectId = projectId
            keys.cycleId = cycle.id
            await keys.flip()
        })
        scope.update = this.update
        return scope
    }
}
