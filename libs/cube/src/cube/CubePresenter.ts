import { Logger } from '../utils/Logger'
import { Application } from './Application'
import { Place } from './Place'
import { PlaceUri, ValidParamTypes } from './PlaceUri'
import { Scope } from './Scope'
import { instrumentViewActions, Presenter, scopeUpdateManagerFactory } from './Presenter'

import { AlertSeverity, ICubePresenter } from './IPresenter'
import { ScopeType, ScopeUpdateManager } from '..'

const LOG = Logger.get('Presenter')

export type PresenterContructor<A extends Application> = { new(app: A): ICubePresenter }

export class CubePresenter<A extends Application, S extends Scope> implements ICubePresenter {
    private presenterEngine: Presenter<S>;
    private readonly __updateManager: ScopeUpdateManager
    private readonly __updateManagerOwner: boolean
    private readonly __beforeScopeUpdateListener: () => void = this.onBeforeScopeUpdate.bind(this)

    public constructor(
        private __app: A,
        private __scope: S, updateManager?: ScopeUpdateManager) {
        
        this.presenterEngine = new Presenter(this.__app, this.__scope);
        if (updateManager) {
            this.__updateManagerOwner = false
            this.__updateManager = updateManager

            updateManager.updateHint(this.__scope.constructor as ScopeType, updateManager.scope)
        } else {
            this.__updateManagerOwner = true
            this.__updateManager = scopeUpdateManagerFactory(this.__scope)
        }

        this.__updateManager.addOnBeforeScopeUpdateListener(this.__beforeScopeUpdateListener)
        this.__updateManager.update(this.__scope)

        instrumentViewActions.call(this)
    }


    public release(): void {
        if (this.__updateManagerOwner) {
            this.__updateManager.release()
        } else {
            this.__updateManager.removeOnBeforeScopeUpdateListener(this.__beforeScopeUpdateListener)
        }
    }

    public get scopeUpdateManager(): ScopeUpdateManager {
        return this.__updateManager
    }

    public get app(): A {
        return this.__app;
    }

    public get scope(): S {
        return this.__scope;
    }

    protected async flip(place: Place, args?: { params?: Record<string, ValidParamTypes>; attrs?: Record<string, unknown> }) {
        return this.app.flip(place, args)
    }

    public async flipToUri(uri: PlaceUri) {
        return await this.app.flipToUri(uri)
    }

    public async applyParameters(uri: PlaceUri, initialization: boolean, last?: boolean): Promise<boolean> {
        LOG.debug(`applyParameters(uri=${uri}, initialization=${initialization}, last=${last}`)
        return true
    }

    // PresenterEngineOverloads
    onBeforeScopeUpdate(): void {
        return this.presenterEngine.onBeforeScopeUpdate()
    }
    unexpected(message: string, error: unknown): void {
        return this.presenterEngine.unexpected(message, error)
    }
    alert(severity: AlertSeverity, title: string, message: string, onClose?: () => Promise<void>): void {
        return this.presenterEngine.alert(severity, title, message)
    }


    // UpdateManager
    public isDirty(): boolean {
        return this.__updateManager.isDirty()
    }

    public isAutoUpdateEnabled(): boolean {
        return this.__updateManager.isAutoUpdateEnabled()
    }

    public disableAutoUpdate(): void {
        this.__updateManager.disableAutoUpdate()
    }

    public updateHint(scopeCtor: ScopeType, scope: S, maxUpdate?: number) {
        this.__updateManager.updateHint(scopeCtor, scope, maxUpdate)
    }

    public update(optionalScope?: S) {
        this.__updateManager.update(optionalScope ?? this.presenterEngine.scope)
    }

    public emitBeforeScopeUpdate(force?: boolean): void {
        if (this.__updateManagerOwner) {
            this.__updateManager.emitBeforeScopeUpdate(force)
        } else {
            if (force) {
                this.__updateManager.update(this.presenterEngine.scope)
            }
            this.__updateManager.emitBeforeScopeUpdate(false)
        }
    }
    
}