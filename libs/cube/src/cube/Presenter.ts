import { Logger } from '../utils/Logger'
import { NOOP_VOID } from '../utils/EmptyFunctions'
import { Application } from './Application'
import { Place } from './Place'
import { PlaceUri, ValidParamTypes } from './PlaceUri'
import { Scope, ScopeType } from './Scope'
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

function pushScope(target: Map<ScopeType, Map<Scope, boolean>>, scope: Scope) {
    let scopeMap = target.get(scope.constructor as ScopeType)
    if (scopeMap) {
        scopeMap.set(scope, true)
    } else {
        scopeMap = new Map()
        scopeMap.set(scope, true)
        target.set(scope.constructor as ScopeType, scopeMap)
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

    private readonly __dirtyScopes: Map<ScopeType, Map<Scope, boolean>>

    private readonly __scopeUpdateFallback: Map<ScopeType, ScopeUpdateConfig> = new Map()

    private readonly __emitBeforeScopeUpdate = this.emitBeforeScopeUpdate.bind(this)

    private __baseScopeUpdateRequested = false

    private __autoUpdateEnabled = true

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

    public disableAutoUpdate(): void {
        this.__autoUpdateEnabled = false
    }

    public updateHint(scopeCtor: ScopeType, scope: Scope, maxUpdate = 10) {
        this.__scopeUpdateFallback.set(scopeCtor, { scope, maxUpdate })
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

    public async flipToUri(uri: PlaceUri) {
        return await this.app.flipToUri(uri)
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async applyParameters(uri: PlaceUri, initialization: boolean, last?: boolean): Promise<boolean> {
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

            if (sourceDirtyScopes.has(this.scope.constructor as ScopeType)) {
                this.scope.update()
                updateCount++
                break
            } else {
                // If fallbacks were configured
                if (this.__scopeUpdateFallback.size > 0) {
                    const newDirtyScopes = new Map<ScopeType, Map<Scope, boolean>>()
                    for (const [scopeCtor, scopeMap] of sourceDirtyScopes.entries()) {
                        const scopeFallbackCfg = this.__scopeUpdateFallback.get(scopeCtor)
                        if (scopeFallbackCfg && scopeMap.size > scopeFallbackCfg.maxUpdate) {
                            scopeMap.clear()
                            scopeMap.set(scopeFallbackCfg.scope, true)
                            changesCount++
                        }
                        newDirtyScopes.set(scopeCtor, scopeMap)
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