import {
    ApplicationPresenter,
    FlipIntent,
    HistoryManager,
    Logger,
    NOOP_PROMISE_VOID,
    Scope,
    SingletonServices,
    type AlertSeverity
} from 'wdc-cube'

import type { Member } from '../../domain'
import { ShowcaseService } from '../../services'
import { ProjectsKeys } from '../projects/projects.key'
import { Places } from '../RouteConsts'
import { SignInKeys } from '../auth/auth.key'
import { MainKeys } from './main.key'
import { AlertScope, type IDialogScope, MainScope, NavItemScope } from './main.scope'

const LOG = Logger.get('Showcase.MainPresenter')

// @Inject
const service = ShowcaseService.INSTANCE

/**
 * The shell, and the only presenter that knows there is a session.
 *
 * Everything else assumes there is one, because this is what refuses to show
 * anything until there is — a place that decides whether other places may be
 * reached is the shape of the whole authorised half of an application, and it
 * is one method here.
 */
export class MainPresenter extends ApplicationPresenter<MainScope> {
    private readonly bodySlot = this.setBodySlot.bind(this)
    private readonly dialogSlot = this.setDialogSlot.bind(this)

    private stopServices = NOOP_PROMISE_VOID

    private member?: Member

    public constructor(historyManager: HistoryManager) {
        super(historyManager, new MainScope())
        this.setPlaces(Places)
    }

    public initialize() {
        let initialized = false

        const bootstrap = async () => {
            try {
                await this.kickStart(Places.main)
                initialized = true
            } catch (error) {
                LOG.error('Initializing', error)
                this.release()
            }
        }

        bootstrap().catch(LOG.caught)

        return () => {
            if (initialized) {
                this.release()
            }
        }
    }

    public override release() {
        this.stopServices().catch(() => undefined)
        super.release()
    }

    public override async applyParameters(
        intent: FlipIntent,
        initialization: boolean,
        last?: boolean
    ): Promise<boolean> {
        const keys = new MainKeys(this, intent)

        if (initialization) {
            await this.initializeState()

            try {
                const target = this.newIntentFromString(this.historyManager.location)
                if (target.toString() !== intent.toString()) {
                    await this.flipToIntent(target)
                    return false
                }
            } catch (caught) {
                this.unexpected('Navigation from history', caught)
            }
        }

        if (last) {
            // Nowhere deeper was reached, so the shell decides where to send the
            // reader: the projects list, or the door.
            this.bodySlot(undefined)
            await this.flip(this.member ? Places.projects : Places.signIn)
            return false
        }

        keys.parentSlot = this.bodySlot
        keys.dialogSlot = this.dialogSlot

        return true
    }

    private async initializeState() {
        this.stopServices = await SingletonServices.start()

        this.scope.onSignOut = this.action(this.onSignOut)
        this.scope.onOpenProjects = this.action(this.onOpenProjects)

        const session = await service.fetchSession()
        this.applySession(session?.member)

        LOG.info('Initialized')
    }

    // ========== SESSION ==========

    /** Whether a place behind the door may be entered at all. */
    public get authenticated(): boolean {
        return this.member !== undefined
    }

    public get currentMember(): Member | undefined {
        return this.member
    }

    /** Sends the reader to the door, remembering nothing: the URL already has it. */
    public async demandSignIn(): Promise<void> {
        await new SignInKeys(this).flip()
    }

    public applySession(member?: Member) {
        this.member = member
        this.scope.member = member
        this.scope.signedIn = member !== undefined
        if (!member) {
            this.scope.navigation = []
            this.scope.projectName = undefined
        }
    }

    /**
     * What the sidebar shows, which depends on where the reader is.
     *
     * A deeper presenter says what its module offers; the shell only draws it.
     * The alternative is a shell that knows every module, which is the thing
     * this architecture exists to avoid.
     */
    public setNavigation(projectName: string | undefined, items: NavItemScope[]) {
        this.scope.projectName = projectName
        this.scope.navigation = items
    }

    public buildNavItem(label: string, icon: string, current: boolean, onSelect: () => Promise<void>): NavItemScope {
        const scope = new NavItemScope()
        scope.label = label
        scope.icon = icon
        scope.current = current
        scope.onSelect = this.action(onSelect)
        scope.update = this.update
        return scope
    }

    // ========== ALERTS ==========

    public override unexpected(message: string, error: unknown) {
        super.unexpected(message, error)
        this.alert('error', 'Something went wrong', message)
    }

    public override alert(severity: AlertSeverity, title: string, message: string, onClose?: () => Promise<void>) {
        const scope = new AlertScope()
        scope.severity = severity
        scope.title = title
        scope.message = message
        scope.onClose = this.action(this.onCloseAlert.bind(this, onClose))
        scope.update = this.update
        this.scope.alert = scope
    }

    // ========== SLOTS ==========

    protected setBodySlot(scope: Scope | undefined | null) {
        this.scope.body = scope ?? undefined
    }

    protected setDialogSlot(scope: Scope | undefined | null) {
        if (this.scope.dialog !== scope) {
            this.scope.dialog = scope as IDialogScope

            if (this.scope.dialog && !this.scope.dialog.onClose) {
                LOG.error(`Missing onClose action on scope ${this.scope.dialog.constructor.name}`)
            }
        }
    }

    // ========== ACTIONS ==========

    protected async onCloseAlert(onClose?: () => Promise<void>) {
        this.scope.alert = undefined
        if (onClose) {
            await onClose()
        }
    }

    protected async onOpenProjects() {
        await new ProjectsKeys(this).flip()
    }

    protected async onSignOut() {
        await service.signOut()
        this.applySession(undefined)
        await this.demandSignIn()
    }
}
