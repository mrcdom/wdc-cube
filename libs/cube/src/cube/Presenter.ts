import lodash from 'lodash'
import { Logger } from '../utils/Logger'
import { NOOP_VOID } from '../utils/EmptyFunctions'
import { Scope, ScopeType } from './Scope'
import { ScopeUtils } from './ScopeUtils'
import { CallbackManager } from './CallbackManager'
import { IPresenterOwner, AlertSeverity } from './IPresenter'

import type { IPresenter } from './IPresenter'

const LOG = Logger.get('PresenterBase')

// @Inject
const callbackManager = CallbackManager.INSTANCE

export class Presenter<S extends Scope> implements IPresenter {

    // :: Private Fields

    public readonly __scope: S

    private readonly __owner: IPresenterOwner

    private readonly __updateManager: ScopeUpdateManager

    private readonly __updateManagerOwner: boolean

    private readonly __beforeScopeUpdateListener: () => void = this.onBeforeScopeUpdate.bind(this)

    public constructor(owner: IPresenterOwner, scope: S, updateManager?: ScopeUpdateManager) {
        this.__owner = owner
        this.__scope = scope

        if (updateManager) {
            this.__updateManagerOwner = false
            this.__updateManager = updateManager

            updateManager.updateHint(scope.constructor as ScopeType, updateManager.scope)
        } else {
            this.__updateManagerOwner = true
            this.__updateManager = new ScopeUpdateManager(scope)
        }

        this.__updateManager.addOnBeforeScopeUpdateListener(this.__beforeScopeUpdateListener)
        this.__updateManager.update(scope)

        instrumentViewActions.call(this)
    }

    public release(): void {
        if (this.__updateManagerOwner) {
            this.__updateManager.release()
        } else {
            this.__updateManager.removeOnBeforeScopeUpdateListener(this.__beforeScopeUpdateListener)
        }
    }

    public get scope() {
        return this.__scope
    }

    public get owner(): IPresenterOwner {
        return this.__owner
    }

    public get scopeUpdateManager(): ScopeUpdateManager {
        return this.__updateManager
    }

    public unexpected(message: string, error: unknown): void {
        this.__owner.unexpected(message, error)
    }

    public alert(severity: AlertSeverity, title: string, message: string, onClose?: () => Promise<void>) {
        this.__owner.alert(severity, title, message, onClose)
    }

    public isDirty(): boolean {
        return this.__updateManager.isDirty()
    }

    public isAutoUpdateEnabled(): boolean {
        return this.__updateManager.isAutoUpdateEnabled()
    }

    public disableAutoUpdate(): void {
        this.__updateManager.disableAutoUpdate()
    }

    public updateHint(scopeCtor: ScopeType, scope: Scope, maxUpdate?: number) {
        this.__updateManager.updateHint(scopeCtor, scope, maxUpdate)
    }

    public update(optionalScope?: Scope) {
        this.__updateManager.update(optionalScope ?? this.scope)
    }

    public emitBeforeScopeUpdate(force?: boolean): void {
        if (this.__updateManagerOwner) {
            this.__updateManager.emitBeforeScopeUpdate(force)
        } else {
            if (force) {
                this.__updateManager.update(this.scope)
            }
            this.__updateManager.emitBeforeScopeUpdate(false)
        }
    }

    public onBeforeScopeUpdate(): void {
        // NOOP
    }

}

type ScopeUpdateConfig = {
    maxUpdate: number
    scope: Scope
}

export class ScopeUpdateManager {

    public readonly __scope: Scope

    private readonly __dirtyScopes: Map<ScopeType, Map<Scope, boolean>>

    private readonly __scopeUpdateFallback: Map<ScopeType, ScopeUpdateConfig> = new Map()

    private readonly __emitBeforeScopeUpdate = this.emitBeforeScopeUpdate.bind(this)

    private __baseScopeUpdateRequested = false

    private __autoUpdateEnabled = true

    private __beforeScopeUpdateHandlerMap = new Map<() => void, number>()

    constructor(scope: Scope) {
        this.__scope = scope
        this.__dirtyScopes = new Map()
    }

    public release() {
        callbackManager.unbind(this.__emitBeforeScopeUpdate)
        this.__scope.update = NOOP_VOID
        this.__beforeScopeUpdateHandlerMap.clear()
        this.__dirtyScopes.clear()
        this.__scopeUpdateFallback.clear()
    }

    public get scope() {
        return this.__scope
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

    public removeUpdateHint(scopeCtor: ScopeType) {
        this.__scopeUpdateFallback.delete(scopeCtor)
    }

    public addOnBeforeScopeUpdateListener(listener: () => void) {
        const count = this.__beforeScopeUpdateHandlerMap.get(listener)
        if (count === undefined) {
            this.__beforeScopeUpdateHandlerMap.set(listener, 1)
        } else {
            this.__beforeScopeUpdateHandlerMap.set(listener, count + 1)
        }
    }

    public removeOnBeforeScopeUpdateListener(listener: () => void) {
        const count = this.__beforeScopeUpdateHandlerMap.get(listener)
        if (count != undefined && count > 0) {
            const nextCount = count - 1
            if (nextCount === 0) {
                this.__beforeScopeUpdateHandlerMap.delete(listener)
            }
        }
    }

    public update(optionalScope?: Scope) {
        if (!this.__baseScopeUpdateRequested) {
            const scope = optionalScope ?? this.__scope

            if (scope === this.__scope) {
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
                for (const listener of this.__beforeScopeUpdateHandlerMap.keys()) {
                    listener()
                }

                if (this.__baseScopeUpdateRequested) {
                    this.__scope.update()
                }
                // Use selective update
                else if (this.selectiveScopeUpdate() === 0 && force) {
                    this.__scope.update()
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

            if (sourceDirtyScopes.has(this.__scope.constructor as ScopeType)) {
                this.__scope.update()
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

function wrapViewAction(impl: (...args: unknown[]) => Promise<void>) {
    function onCatch(this: IPresenter, caught: unknown) {
        this.unexpected(`During execution of ${impl.name} action`, caught)
    }

    function onFinally(this: IPresenter) {
        if (this.isAutoUpdateEnabled()) {
            this.emitBeforeScopeUpdate(true)
        }
    }

    return function (this: IPresenter, ...args: unknown[]) {
        try {
            const result = impl.apply(this, args) as unknown

            // Result is a valid promise
            if (result && (result as Promise<unknown>).catch && (result as Promise<unknown>).finally) {
                return (result as Promise<unknown>)
                    .catch(onCatch.bind(this))
                    .finally(onFinally.bind(this))
            }
            // Otherwhise, is a synchronous action
            else {
                onFinally.call(this)
                return result
            }
        } catch (caught) {
            // Will only be actioned on sincronus actions
            onCatch.call(this, caught)
            return undefined
        }
    }
}

export function instrumentViewActions(this: IPresenter) {
    const ctor = (this.constructor as unknown) as Record<string, unknown>

    if (!ctor.$$instrumented$$) {
        try {
            const proto = Object.getPrototypeOf(this) as Record<string, unknown>
            const methodNames = Object.getOwnPropertyNames(proto)
            for (const key of methodNames) {
                const value = proto[key]
                if (value !== this.onBeforeScopeUpdate && ScopeUtils.isAnActionName(key) && lodash.isFunction(value)) {
                    proto[key] = wrapViewAction(value)
                }
            }
        } finally {
            ctor.$$instrumented$$ = true
        }
    }
}