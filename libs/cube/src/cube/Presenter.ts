import { NOOP_VOID } from './Constants'
import { Application } from './Application'
import { Place } from './Place'
import { PlaceUri, ValidParamTypes } from './PlaceUri'
import { Scope } from './Scope'
import { ScopeUtils } from './ScopeUtils'

import type { IPresenter } from './IPresenter'
import type { AlertSeverity } from './Application'
import { Logger } from '../utils/Logger'

const LOG = Logger.get('Presenter')

export type PresenterMapType = Map<number, IPresenter>
export type PresenterFactory = (app: Application) => IPresenter

export type PresenterType = Presenter<Application, Scope>
export type PresenterContructor<A extends Application> = { new(app: A): PresenterType }

export class Presenter<A extends Application, S extends Scope> implements IPresenter {

    protected readonly app: A

    public readonly scope: S

    private readonly __dirtyScopes: Map<Scope, Scope>

    private __dirtyHandler?: NodeJS.Timeout

    private __runningOnBeforeScopeUpdate = false

    private __oldState: Map<string, Record<string, unknown>>

    private __enableApply = false

    private __debugApply = false

    public constructor(app: A, scope: S) {
        this.app = app
        this.scope = scope
        this.__dirtyScopes = new Map()
        this.__oldState = new Map()

        this.update(this.scope)
    }

    public release(): void {
        this.scope.update = NOOP_VOID
        this.__dirtyScopes.clear()
        this.cancelDirtyScopesUpdate()
    }

    public enableApply() {
        this.__enableApply = true
        this.__oldState = ScopeUtils.exportState(this.scope)

        //for(const a of Object.keys(this.constructor.prototype)) {
        //    LOG.info(a)
        //}
    }

    private cancelDirtyScopesUpdate() {
        if (this.__dirtyHandler) {
            clearTimeout(this.__dirtyHandler)
            this.__dirtyHandler = undefined
        }
    }

    protected unexpected(message: string, error: unknown) {
        this.app.unexpected(message, error)
        this.app.alert('error', 'Unexpected error', message)
    }

    public alert(severity: AlertSeverity, title: string, message: string, onClose?: () => Promise<void>) {
        this.app.alert(severity, title, message, onClose)
    }

    protected async flip(place: Place, args?: { params?: Record<string, ValidParamTypes>; attrs?: Record<string, unknown> }) {
        return this.app.flip(place, args)
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async applyParameters(uri: PlaceUri, initialization: boolean, deepest?: boolean): Promise<boolean> {
        return true
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public publishParameters(uri: PlaceUri): void {
        // NOOP
    }

    public onBeforeScopeUpdate(): void {
        // NOOP
    }

    public update<T extends Scope>(optionalScope?: T) {
        const scope = optionalScope ?? this.scope
        if (this.__runningOnBeforeScopeUpdate) {
            this.__dirtyScopes.set(scope, scope)
        } else {
            this.cancelDirtyScopesUpdate()
            this.__dirtyScopes.set(scope, scope)
            this.__dirtyHandler = setTimeout(this.__doUpdateDirtyScopes, 16)
        }
    }

    public apply(debug = false) {
        this.__debugApply = debug
        this.update(this.scope)
    }

    public emitBeforeScopeUpdate(): void {
        try {
            this.cancelDirtyScopesUpdate()

            try {
                this.__runningOnBeforeScopeUpdate = true
                this.onBeforeScopeUpdate()
            } finally {
                this.__runningOnBeforeScopeUpdate = false
            }

            if (this.__enableApply) {
                const dirtyScopes = ScopeUtils.exportDirties(this.scope, this.__oldState)
                if (dirtyScopes.size > 0) {
                    if (this.__debugApply) {
                        LOG.debug('SCOPE Dirties:', JSON.stringify(Object.keys(Object.fromEntries(dirtyScopes)), null, '  '))
                    }

                    for (const dirtyScope of dirtyScopes.values()) {
                        this.__dirtyScopes.set(dirtyScope, dirtyScope)
                    }
                }
                this.__debugApply = false
            }

            if(this.__dirtyScopes.has(this.scope)) {
                this.scope.update()
            } else for (const scope of this.__dirtyScopes.values()) {
                scope.update()
            }
        } catch (caught) {
            LOG.error('Updating dirty scopes')
        } finally {
            this.__dirtyScopes.clear()
            if (this.__enableApply) {
                this.__oldState = ScopeUtils.exportState(this.scope)
            }
        }
    }

    private __doUpdateDirtyScopes = () => {
        this.emitBeforeScopeUpdate()
    }

}

export function newPresenterFactory<A extends Application>(ctor: PresenterContructor<A>): PresenterFactory {
    return (app) => {
        return new ctor((app as unknown) as A)
    }
}