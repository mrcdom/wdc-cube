import { CubePresenter, FlipIntent, Logger, NOOP_VOID, ScopeSlot } from 'wdc-cube'

import type { Project } from '../../domain'
import { ShowcaseService } from '../../services'
import { DashboardKeys } from '../dashboard/dashboard.key'
import type { MainPresenter } from '../main/main.presenter'
import { ProjectsKeys } from './projects.key'
import { ProjectCardScope, ProjectsScope } from './projects.scope'

const LOG = Logger.get('Showcase.ProjectsPresenter')

// @Inject
const service = ShowcaseService.INSTANCE

export class ProjectsPresenter extends CubePresenter<MainPresenter, ProjectsScope> {
    private parentSlot: ScopeSlot = NOOP_VOID

    public constructor(app: MainPresenter) {
        super(app, new ProjectsScope())
    }

    public override async applyParameters(intent: FlipIntent, initialization: boolean): Promise<boolean> {
        // The door first. A place behind it does not get to run and then
        // discover it should not have.
        if (!this.app.authenticated) {
            await this.app.demandSignIn()
            return false
        }

        const keys = new ProjectsKeys(this.app, intent)

        if (initialization) {
            this.parentSlot = keys.parentSlot
            this.app.setNavigation(undefined, [])
            LOG.info('Initialized')
        }

        // The slot first, so the cards' skeleton is on screen while they load.
        this.parentSlot(this.scope)

        if (initialization) {
            await this.load()
        }

        return true
    }

    private async load() {
        try {
            const [projects, members] = await Promise.all([service.fetchProjects(), service.fetchMembers()])
            const leadName = new Map(members.map((member) => [member.id, member.name]))

            this.scope.projects = projects.map((project) => this.buildCard(project, leadName.get(project.leadId) ?? ''))
            this.scope.error = undefined
        } catch (caught) {
            this.scope.error = caught instanceof Error ? caught.message : 'Could not load the projects.'
        } finally {
            this.scope.loading = false
        }
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
