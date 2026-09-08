import { CubePresenter, FlipIntent, Logger, Place } from 'wdc-cube'

import type { Id, Member, Project } from '../../domain'
import { ShowcaseService } from '../../services'
import { CyclesKeys } from '../cycles/cycles.key'
import { DashboardKeys } from '../dashboard/dashboard.key'
import { IssuesKeys } from '../issues/issues.key'
import type { MainPresenter } from '../main/main.presenter'
import { ProjectsKeys } from '../projects/projects.key'
import { Places } from '../RouteConsts'
import { ProjectKeys } from './project.key'
import { ProjectScope } from './project.scope'

const LOG = Logger.get('Showcase.ProjectPresenter')

// @Inject
const service = ShowcaseService.INSTANCE

/** Which of the three the reader is standing on. */
type Section = 'dashboard' | 'issues' | 'cycles'

type ProjectKeysConstructor = new (app: MainPresenter) => ProjectKeys

/**
 * The selected project — the place everything about one project stands inside.
 *
 * The tree used to read `projects/{dashboard,issues,cycles}`, which mirrored how
 * a reader gets here rather than what these places are: issues belong to *a
 * project*, not to the list of projects. Saying so moves four things that were
 * copied into every screen up to the one place they were always about:
 *
 *   - the door, so a place inside a project never has to check the session;
 *   - the selected project, declared once in `ProjectKeys`;
 *   - the record and the people, fetched once instead of once per screen;
 *   - the sidebar, which is the same three entries whichever one is open.
 *
 * The fetch is deliberately *not* awaited here. The framework walks the path
 * from the root and awaits each step, so anything this place waits for is time
 * its children have not yet started spending — the request goes out here and is
 * joined below, which leaves the project and the screen's own data in flight
 * together rather than one after the other.
 */
export class ProjectPresenter extends CubePresenter<MainPresenter, ProjectScope> {
    private projectId?: Id
    private section?: Section

    private loading: Promise<void> = Promise.resolve()
    private peopleRequest?: Promise<Member[]>
    private record?: Project
    private people: Member[] = []

    public constructor(app: MainPresenter) {
        super(app, new ProjectScope())
    }

    public override async applyParameters(
        intent: FlipIntent,
        initialization: boolean,
        last?: boolean
    ): Promise<boolean> {
        // The door, once, for everything inside a project. A place below this
        // one does not get to run and then discover it should not have.
        if (!this.app.authenticated) {
            await this.app.demandSignIn()
            return false
        }

        const keys = new ProjectKeys(this.app, intent)
        keys.owner = this

        if (initialization) {
            LOG.info('Initialized')
        }

        if (initialization || this.projectId !== keys.projectId) {
            this.projectId = keys.projectId
            this.record = undefined
            this.loading = this.load(keys.projectId)
        }

        if (last) {
            // Nothing deeper was named, and a project on its own is not a
            // screen: it opens on its dashboard, or on the picker when there is
            // no project to open.
            const target: ProjectKeys = this.projectId ? new DashboardKeys(this.app) : new ProjectsKeys(this.app)
            target.projectId = this.projectId
            await target.flip()
            return false
        }

        this.section = sectionOf(intent.place)
        this.showNavigation()

        return true
    }

    public override publishParameters(intent: FlipIntent): void {
        const keys = new ProjectKeys(this.app, intent)
        keys.projectId = this.projectId
    }

    // ========== WHAT THE PLACES INSIDE ASK FOR ==========

    /** The project's record, once {@link whenLoaded} has settled. */
    public get project(): Project | undefined {
        return this.record
    }

    /** Everyone who can be assigned an issue, once {@link whenLoaded} has settled. */
    public get members(): Member[] {
        return this.people
    }

    /**
     * Resolves when the record and the people are in hand.
     *
     * A screen joins this to its own request rather than waiting for it first,
     * which is what keeps the two in flight together.
     */
    public whenLoaded(): Promise<void> {
        return this.loading
    }

    private async load(projectId?: Id) {
        try {
            const [project, members] = await Promise.all([
                projectId ? service.fetchProject(projectId) : undefined,
                this.loadPeople()
            ])

            if (this.projectId !== projectId) {
                // The reader moved to another project while this was in the air.
                return
            }

            this.record = project
            this.people = members

            // Said again, because the project's name only exists now and it is
            // what labels the group in the sidebar.
            this.showNavigation()
        } catch (caught) {
            this.app.unexpected('Loading the project', caught)
        }
    }

    /**
     * Everyone in the workspace, fetched once.
     *
     * The people are the workspace's rather than the project's — the same list
     * answers for whoever leads a project on the picker and whoever an issue is
     * assigned to on a board — so moving from one project to another does not
     * ask for them again.
     */
    private loadPeople(): Promise<Member[]> {
        this.peopleRequest ??= service.fetchMembers()
        return this.peopleRequest
    }

    /**
     * What the shell offers while the reader is inside a project.
     *
     * One implementation rather than the three near-identical copies the three
     * screens each carried, and it is the parent's to write: these are its own
     * children, so knowing their places is knowing its own shape.
     */
    private showNavigation() {
        const projectId = this.projectId
        if (!projectId) {
            this.app.setNavigation(undefined, [])
            return
        }

        const go = (Keys: ProjectKeysConstructor) => async () => {
            const keys = new Keys(this.app)
            keys.projectId = projectId
            await keys.flip()
        }

        this.app.setNavigation(this.record?.name, [
            this.app.buildNavItem('Dashboard', 'dashboard', this.section === 'dashboard', go(DashboardKeys)),
            this.app.buildNavItem('Issues', 'issues', this.section === 'issues', go(IssuesKeys)),
            this.app.buildNavItem('Cycles', 'cycles', this.section === 'cycles', go(CyclesKeys))
        ])
    }
}

/**
 * Which entry to mark, read from where the reader is going.
 *
 * The destination is on the intent, so no screen has to announce itself — and
 * an issue's dialog marks Issues without the list having run, which is what
 * happens when a link opens straight into one.
 */
function sectionOf(place: Place): Section | undefined {
    switch (place) {
        case Places.dashboard:
            return 'dashboard'
        case Places.issues:
        case Places.issueDetail:
            return 'issues'
        case Places.cycles:
            return 'cycles'
        default:
            return undefined
    }
}
