import { Logger } from '../utils/Logger'
import { NOOP_VOID } from '../utils/EmptyFunctions'
import { Scope, ScopeConstructor } from './Scope'
import { CallbackManager } from './CallbackManager'
import { IPresenterOwner, IUpdateManager, AlertSeverity } from './IPresenter'

import type { IPresenter } from './IPresenter'

const LOG = Logger.get('Presenter')

// @Inject
const callbackManager = CallbackManager.singleton()

export class Presenter<S extends Scope, OWNER extends IPresenterOwner = IPresenterOwner> implements IPresenter {
    // :: Private Fields

    private readonly __scope: S

    private readonly __owner: OWNER

    private readonly __updateManager: IUpdateManager

    private readonly __updateManagerOwner: boolean

    private readonly __beforeScopeUpdateListener: () => void

    private __updateCount = 0

    private __releasePhase = 0

    public constructor(owner: OWNER, scope: S, updateManager?: IUpdateManager) {
        this.__owner = owner
        this.__scope = scope

        this.__beforeScopeUpdateListener = () => {
            try {
                this.onBeforeScopeUpdate()
            } finally {
                this.__updateCount = 0
            }
        }

        if (updateManager) {
            this.__updateManagerOwner = false
            this.__updateManager = updateManager

            updateManager.hint(scope.constructor as ScopeConstructor, updateManager.scope, 10)
        } else {
            this.__updateManagerOwner = true
            this.__updateManager = new ScopeUpdateManager(scope)
        }

        this.__updateManager.addOnBeforeScopeUpdateListener(this.__beforeScopeUpdateListener)
        this.__updateManager.update(scope)

        this.__scope.update = this.update
    }

    public release(): void {
        try {
            this.__releasePhase = 1
            this.__scope.update = NOOP_VOID
            this.__scope.forceUpdate = NOOP_VOID
            if (this.__updateManagerOwner) {
                this.__updateManager.release()
            } else {
                this.__updateManager.removeOnBeforeScopeUpdateListener(this.__beforeScopeUpdateListener)
            }
        } finally {
            this.__releasePhase = 2
        }
    }

    public get isReleasing(): boolean {
        return this.__releasePhase === 1
    }

    public get isReleased(): boolean {
        return this.__releasePhase > 0
    }

    public get scope(): S {
        return this.__scope
    }

    public get owner(): OWNER {
        return this.__owner
    }

    public get updateManager(): IUpdateManager {
        return this.__updateManager
    }

    public unexpected(message: string, error: unknown): void {
        this.__owner.unexpected(message, error)
    }

    public alert(severity: AlertSeverity, title: string, message: string, onClose?: () => Promise<void>) {
        this.__owner.alert(severity, title, message, onClose)
    }

    public readonly update = this.doUpdate.bind(this)

    protected doUpdate(optionalScope?: Scope) {
        this.__updateManager.update(optionalScope ?? this.scope)
        this.__updateCount++
    }

    public updateIfNotDirty(scope: Scope) {
        if (this.__updateCount === 0) {
            this.doUpdate(scope)
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

export class ScopeUpdateManager implements IUpdateManager {
    static newUpdateRoot(scope: Scope) {
        var mgr = new ScopeUpdateManager(scope)
        return (optionalScope?: Scope) => mgr.update(optionalScope)
    }

    // :: Instance

    private readonly __scope: Scope

    private readonly __dirtyScopes: Map<ScopeConstructor, Map<Scope, boolean>>

    private readonly __cancelledScopes: Map<ScopeConstructor, boolean>

    private readonly __scopeUpdateFallback: Map<ScopeConstructor, ScopeUpdateConfig> = new Map()

    private readonly __emitBeforeScopeUpdate = this.emitBeforeScopeUpdate.bind(this)

    private __baseScopeUpdateRequested = false

    private __autoUpdateEnabled = true

    private __beforeScopeUpdateHandlerMap = new Map<() => void, number>()

    private __emittingOnBeforeScopeUpdate = false

    private __releasePhase = 0

    constructor(scope: Scope) {
        this.__scope = scope
        this.__dirtyScopes = new Map()
        this.__cancelledScopes = new Map()
    }

    public release() {
        this.__releasePhase = 1
        try {
            callbackManager.unbind(this.__emitBeforeScopeUpdate)
            this.__scope.forceUpdate = NOOP_VOID
            this.__beforeScopeUpdateHandlerMap.clear()
            this.__dirtyScopes.clear()
            this.__scopeUpdateFallback.clear()
        } finally {
            this.__releasePhase = 2
        }
    }

    public get isReleasing(): boolean {
        return this.__releasePhase === 1
    }

    public get isReleased(): boolean {
        return this.__releasePhase > 0
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

    public hint(scopeCtor: ScopeConstructor, scope: Scope, maxUpdate = 10) {
        this.__scopeUpdateFallback.set(scopeCtor, { scope, maxUpdate })
    }

    public removeUpdateHint(scopeCtor: ScopeConstructor) {
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
                this.__cancelledScopes.clear()
            } else {
                this.pushScope(this.__dirtyScopes, scope)
            }
        }

        if (!this.__emittingOnBeforeScopeUpdate) {
            callbackManager.bindOnce(this.__emitBeforeScopeUpdate)
        }
    }

    public emitBeforeScopeUpdate(): void {
        try {
            this.__emittingOnBeforeScopeUpdate = true
            for (const listener of this.__beforeScopeUpdateHandlerMap.keys()) {
                try {
                    listener()
                } catch (caught) {
                    LOG.error('Running onBeforeScopeUpdate', caught)
                }
            }

            if (this.__cancelledScopes.size > 0) {
                // Remove all cancelled scopes
                for (const key of this.__cancelledScopes.keys()) {
                    this.__dirtyScopes.delete(key)
                }
                this.__cancelledScopes.clear()
            }

            if (this.__baseScopeUpdateRequested || this.__dirtyScopes.size > 0) {
                try {
                    if (this.__baseScopeUpdateRequested) {
                        this.__scope.forceUpdate()
                    }
                    // Use selective update
                    else {
                        this.selectiveScopeUpdate()
                    }
                } catch (caught) {
                    LOG.error('Updating dirty scopes', caught)
                } finally {
                    this.__dirtyScopes.clear()
                    this.__cancelledScopes.clear()
                    this.__baseScopeUpdateRequested = false
                }
            }
        } finally {
            callbackManager.unbind(this.__emitBeforeScopeUpdate)
            this.__emittingOnBeforeScopeUpdate = false
        }
    }

    private selectiveScopeUpdate(): number {
        let updateCount = 0
        let changesCount = 0
        let sourceDirtyScopes = this.__dirtyScopes
        do {
            changesCount = 0

            if (sourceDirtyScopes.has(this.__scope.constructor as ScopeConstructor)) {
                this.__scope.forceUpdate()
                updateCount++
                break
            } else {
                // If fallbacks were configured
                if (this.__scopeUpdateFallback.size > 0) {
                    const newDirtyScopes = new Map<ScopeConstructor, Map<Scope, boolean>>()
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
                            try {
                                scope.forceUpdate()
                            } catch (caught) {
                                LOG.info('scope.forceUpdate: ', scope, caught)
                            }
                            updateCount++
                        }
                    }
                }
            }
        } while (changesCount > 0)

        return updateCount
    }

    private pushScope(target: Map<ScopeConstructor, Map<Scope, boolean>>, scope: Scope) {
        const key = scope.constructor as ScopeConstructor
        let scopeMap = target.get(key)
        if (scopeMap) {
            const cfg = this.__scopeUpdateFallback.get(key)
            if (cfg && cfg.scope !== scope && scopeMap.size >= cfg.maxUpdate) {
                this.pushScope(target, cfg.scope)
                this.__cancelledScopes.set(key, true)
            } else {
                scopeMap.set(scope, true)
            }
        } else {
            scopeMap = new Map()
            scopeMap.set(scope, true)
            target.set(key, scopeMap)
        }
    }
}
