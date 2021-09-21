import { Logger } from '../utils/Logger'
import { Place } from './Place'
import { PlaceUri } from './PlaceUri'
import { HistoryManager } from './HistoryManager'
import { Application } from './Application'
import { FlipContext } from './FlipContext'
import { Scope, ScopeType } from './Scope'
import { instrumentViewActions, ScopeUpdateManager } from './Presenter'

import type { ICubePresenter } from './IPresenter'

const LOG = Logger.get('ApplicationPresenter')

export class ApplicationPresenter<S extends Scope> extends Application implements ICubePresenter {

    private readonly __scopeUpdateManager: ScopeUpdateManager

    private readonly __beforeScopeUpdateListener: () => void = this.onBeforeScopeUpdate.bind(this)

    public constructor(historyManager: HistoryManager, scope: S) {
        super(Place.ROOT, historyManager)

        this.__scopeUpdateManager = new ScopeUpdateManager(scope)
        this.__scopeUpdateManager.addOnBeforeScopeUpdateListener(this.__beforeScopeUpdateListener)

        this.__scopeUpdateManager.update(scope)

        instrumentViewActions.call(this)
    }

    public get scope() {
        return this.__scopeUpdateManager.scope as S
    }

    public get scopeUpdateManager() {
        return this.__scopeUpdateManager
    }

    public override release() {
        this.__scopeUpdateManager.release()
        super.release()
    }

    public isAutoUpdateEnabled(): boolean {
        return this.__scopeUpdateManager.isAutoUpdateEnabled()
    }

    public isDirty(): boolean {
        return this.__scopeUpdateManager.isDirty()
    }

    public disableAutoUpdate(): void {
        this.__scopeUpdateManager.disableAutoUpdate()
    }

    protected override publishAllParameters(uri: PlaceUri) {
        this.publishParameters(uri)
        super.publishAllParameters(uri)
    }

    protected override async applyPathParameters(context: FlipContext, atLevel: number) {
        try {
            const uri = context.targetUri
            const ok = await this.applyParameters(uri, false, uri.place.id === -1)
            if (!ok) {
                return
            }

            await super.applyPathParameters(context, atLevel)
        } catch (caught) {
            if (this.fallbackPlace !== this.rootPlace) {
                LOG.error('Failed navigating just on root presenter. Going to fallback place', caught)
                this.flip(this.fallbackPlace)
            } else {
                LOG.error('Failed navigating just on root presenter. Nothing can be done!', caught)
            }
            return
        }
    }

    public updateHint(scopeCtor: ScopeType, scope: Scope, maxUpdate?: number) {
        this.__scopeUpdateManager.updateHint(scopeCtor, scope, maxUpdate)
    }

    public update<T extends Scope>(optionalScope?: T) {
        this.__scopeUpdateManager.update(optionalScope ?? this.scope)
    }

    protected override emitAllBeforeScopeUpdate() {
        super.emitAllBeforeScopeUpdate()

        if (this.isAutoUpdateEnabled()) {
            this.emitBeforeScopeUpdate(true)
        }
    }

    public emitBeforeScopeUpdate(force = false): void {
        this.__scopeUpdateManager.emitBeforeScopeUpdate(force)
    }

    public async applyParameters(uri: PlaceUri, initialization: boolean, last: boolean): Promise<boolean> {
        LOG.debug(`applyParameters(uri=${uri}, initialization=${initialization}, last=${last}`)
        return true
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public publishParameters(uri: PlaceUri): void {
        // NOOP
    }

    public onBeforeScopeUpdate(): void {
        // NOOP
    }

}