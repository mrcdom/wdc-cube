import { CubePresenter, FlipIntent, Logger, NOOP_VOID, ScopeSlot } from 'wdc-cube'

import type { Member, Project } from '../../domain'
import { ShowcaseService } from '../../services'
import { DashboardKeys } from '../dashboard/dashboard.key'
import type { MainPresenter } from '../main/main.presenter'
import type { ProjectPresenter } from '../project/project.presenter'
import { ProjectsKeys } from './projects.key'
import { ProjectCardScope, ProjectsScope } from './projects.scope'

const LOG = Logger.get('Showcase.ProjectsPresenter')

// @Inject
const service = ShowcaseService.INSTANCE

/**
 * Choosing which project to be in.
 *
 * The one place inside `project` that does not need one — and, coming from a
 * project, the one that keeps it anyway. A new intent starts from wherever the
 * application already is, so arriving here from a dashboard carries the
 * selection along: the sidebar still names the project, `Dashboard` still leads
 * back to it, and the URL still says which one. Looking at what else there is
 * has not changed anything yet, and only picking a card does.
 *
 * Arriving with nothing selected — straight after signing in, or by link — is
 * the other half of the same rule, and there the sidebar is bare.
 */
export class ProjectsPresenter extends CubePresenter<MainPresenter, ProjectsScope> {
    private parentSlot: ScopeSlot = NOOP_VOID
    private owner?: ProjectPresenter
    private loaded = false

    public constructor(app: MainPresenter) {
        super(app, new ProjectsScope())
    }

    public override async applyParameters(intent: FlipIntent, initialization: boolean): Promise<boolean> {
        const keys = new ProjectsKeys(this.app, intent)

        if (initialization) {
            this.parentSlot = keys.parentSlot
            this.owner = keys.owner
            LOG.info('Initialized')
        }

        // The slot first, so the cards' skeleton is on screen while they load.
        this.parentSlot(this.scope)

        if (!this.loaded) {
            this.loaded = true
            await this.load()
        }

        return true
    }

    private async load() {
        try {
            // The people are already on their way down from `project`, so this
            // joins that request rather than making a second one.
            const [projects, members] = await Promise.all([service.fetchProjects(), this.members()])
            const leadName = new Map(members.map((member) => [member.id, member.name]))

            this.scope.projects = projects.map((project) => this.buildCard(project, leadName.get(project.leadId) ?? ''))
            this.scope.error = undefined
        } catch (caught) {
            this.scope.error = caught instanceof Error ? caught.message : 'Could not load the projects.'
        } finally {
            this.scope.loading = false
        }
    }

    private async members(): Promise<Member[]> {
        await this.owner?.whenLoaded()
        return this.owner?.members ?? []
    }

    private buildCard(project: Project, leadName: string): ProjectCardScope {
        const scope = new ProjectCardScope()
        // A card stands for a project, and the project's id is what it is —
        // which keeps a row on its project when the list is reloaded.
        scope.identity = project.id
        scope.name = project.name
        scope.projectKey = project.key
        scope.description = project.description
        scope.hue = project.hue
        scope.issueCount = project.issueCount
        scope.leadName = leadName
        scope.onOpen = this.action(this.onOpen.bind(this, project.id))
        scope.update = this.update
        return scope
    }

    protected async onOpen(projectId: string) {
        // A project opens on its dashboard: the numbers first, and every one of
        // them a link into the list that explains it.
        const keys = new DashboardKeys(this.app)
        keys.projectId = projectId
        await keys.flip()
    }
}
