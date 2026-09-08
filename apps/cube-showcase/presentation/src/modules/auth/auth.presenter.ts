import { CubePresenter, FlipIntent, Logger, NOOP_VOID, ScopeSlot } from 'wdc-cube'

import { ShowcaseService } from '../../services'
import type { MainPresenter } from '../main/main.presenter'
import { ProjectsKeys } from '../projects/projects.key'
import { SignInKeys } from './auth.key'
import { SignInScope } from './auth.scope'

const LOG = Logger.get('Showcase.SignInPresenter')

// @Inject
const service = ShowcaseService.INSTANCE

export class SignInPresenter extends CubePresenter<MainPresenter, SignInScope> {
    private parentSlot: ScopeSlot = NOOP_VOID

    public constructor(app: MainPresenter) {
        super(app, new SignInScope())
    }

    public override async applyParameters(intent: FlipIntent, initialization: boolean): Promise<boolean> {
        if (initialization) {
            const keys = new SignInKeys(this.app, intent)
            this.parentSlot = keys.parentSlot

            // The door has no sidebar to offer.
            this.app.setNavigation(undefined, [])

            this.scope.onNameChanged = this.handleNameChanged.bind(this)
            this.scope.onSignIn = this.action(this.onSignIn)

            const members = await service.fetchMembers()
            this.scope.suggestions = members.map((member) => member.name)
            this.scope.name = this.scope.suggestions[0] ?? ''

            LOG.info('Initialized')
        }

        this.parentSlot(this.scope)
        return true
    }

    protected handleNameChanged(name: string) {
        // Not an action: it only mirrors what was typed, and redrawing the field
        // on every keystroke is how a field loses its caret.
        this.scope.name = name
    }

    protected async onSignIn() {
        const name = (this.scope.name ?? '').trim()
        if (!name) {
            this.scope.error = 'Pick a name to continue.'
            return
        }

        this.scope.busy = true
        this.scope.error = undefined

        try {
            const session = await service.signIn(name)
            this.app.applySession(session.member)
            await new ProjectsKeys(this.app).flip()
        } catch (caught) {
            this.scope.error = caught instanceof Error ? caught.message : 'Could not sign in.'
        } finally {
            this.scope.busy = false
        }
    }
}
