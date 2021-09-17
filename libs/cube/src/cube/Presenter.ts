import { Logger } from '../utils/Logger'
import { NOOP_VOID } from './Constants'
import { Application } from './Application'
import { Place } from './Place'
import { PlaceUri, ValidParamTypes } from './PlaceUri'
import { Scope } from './Scope'
import { CallbackManager } from './CallbackManager'
import { instrumentViewActions } from './IPresenter'

import type { IPresenter, IPresenterBase } from './IPresenter'
import type { AlertSeverity } from './Application'

const LOG = Logger.get('Presenter')

// @Inject
const callbackManager = CallbackManager.INSTANCE

type ScopeUpdateConfig = {
    maxUpdate: number
    scope: Scope
}

function pushScope(target: Map<string, Map<Scope, boolean>>, scope: Scope) {
    let scopeMap = target.get(scope.vid)
    if (scopeMap) {
        scopeMap.set(scope, true)
    } else {
        scopeMap = new Map()
        scopeMap.set(scope, true)
        target.set(scope.vid, scopeMap)
    }
}

export type PresenterMapType = Map<number, IPresenter>
export type PresenterFactory = (app: Application) => IPresenter

export type PresenterType = Presenter<Application, Scope>
export type PresenterContructor<A extends Application> = { new(app: A): PresenterType }

export class Presenter<A extends Application, S extends Scope> implements IPresenterBase<S> {

    protected readonly app: A

    public readonly scope: S

    // :: Private Fields

    private readonly __dirtyScopes: Map<string, Map<Scope, boolean>>

    private readonly __scopeUpdateFallback: Map<string, ScopeUpdateConfig> = new Map()

    private readonly __emitBeforeScopeUpdate = this.emitBeforeScopeUpdate.bind(this)

    private __baseScopeUpdateRequested = false

    private __autoUpdateEnabled = false

    public constructor(app: A, scope: S) {
        this.app = app
        this.scope = scope
        this.__dirtyScopes = new Map()

        this.update(this.scope)

        instrumentViewActions.call(this)
    }

    public release(): void {
        callbackManager.unbind(this.__emitBeforeScopeUpdate)
        this.scope.update = NOOP_VOID
        this.__dirtyScopes.clear()
        this.__scopeUpdateFallback.clear()
    }

    public isDirty(): boolean {
        return this.__baseScopeUpdateRequested || this.__dirtyScopes.size > 0
    }

    public isAutoUpdateEnabled(): boolean {
        return this.__autoUpdateEnabled
    }

    public enableAutoUpdate() {
        if (!this.__autoUpdateEnabled) {
            // TODO
            this.__autoUpdateEnabled = true
        }
    }

    public configureUpdate(vid: string, maxUpdate: number, scope: Scope) {
        this.__scopeUpdateFallback.set(vid, { maxUpdate, scope })
    }

    public unexpected(message: string, error: unknown): void {
        this.app.unexpected(message, error)
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

    public update(optionalScope?: Scope) {
        if (!this.__baseScopeUpdateRequested) {
            const scope = optionalScope ?? this.scope

            if (scope === this.scope) {
                this.__baseScopeUpdateRequested = true
                this.__dirtyScopes.clear()
            } else {
                pushScope(this.__dirtyScopes, scope)
            }
        }

        callbackManager.bindOnce(this.__emitBeforeScopeUpdate)
    }

    public emitBeforeScopeUpdate(force = false): void {
        if (force || this.__baseScopeUpdateRequested || this.__dirtyScopes.size > 0) {
            try {
                this.onBeforeScopeUpdate()

                if (this.__baseScopeUpdateRequested) {
                    this.scope.update()
                }
                // Use selective update
                else if (this.selectiveScopeUpdate() === 0 && force) {
                    this.scope.update()
                }
            } catch (caught) {
                LOG.error('Updating dirty scopes')
            } finally {
                this.__dirtyScopes.clear()
                this.__baseScopeUpdateRequested = false
            }
        }
    }

    private selectiveScopeUpdate(): number {
        let updateCount = 0
        let changesCount = 0
        let sourceDirtyScopes = this.__dirtyScopes
        do {
            changesCount = 0

            if (sourceDirtyScopes.has(this.scope.vid)) {
                this.scope.update()
                updateCount++
                break
            } else {
                // If fallbacks were configured
                if (this.__scopeUpdateFallback.size > 0) {
                    const newDirtyScopes = new Map<string, Map<Scope, boolean>>()
                    for (const [vid, scopeMap] of sourceDirtyScopes.entries()) {
                        const scopeFallbackCfg = this.__scopeUpdateFallback.get(vid)
                        if (scopeFallbackCfg && scopeMap.size > scopeFallbackCfg.maxUpdate) {
                            scopeMap.clear()
                            scopeMap.set(scopeFallbackCfg.scope, true)
                            changesCount++
                        }
                        newDirtyScopes.set(vid, scopeMap)
                    }
                    sourceDirtyScopes = newDirtyScopes
                }

                if (changesCount === 0) {
                    for (const scopeMap of sourceDirtyScopes.values()) {
                        for (const scope of scopeMap.keys()) {
                            scope.update()
                            updateCount++
                        }
                    }
                }
            }
        } while (changesCount > 0)

        return updateCount
    }

}

export function newPresenterFactory<A extends Application>(ctor: PresenterContructor<A>): PresenterFactory {
    return (app) => {
        return new ctor((app as unknown) as A)
    }
}