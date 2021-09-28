import { Logger } from '../utils/Logger'
import { NOOP_VOID } from '../utils/EmptyFunctions'
import { Place } from './Place'
import { PlaceUri } from './PlaceUri'
import { HistoryManager } from './HistoryManager'
import { Application } from './Application'
import { FlipContext } from './FlipContext'
import { Scope } from './Scope'
import { ScopeUpdateManager } from './Presenter'

import type { IUpdateManager, ICubePresenter } from './IPresenter'

const LOG = Logger.get('ApplicationPresenter')

export class ApplicationPresenter<S extends Scope> extends Application implements ICubePresenter {

    private __scope: S

    private readonly __scopeUpdateManager: IUpdateManager

    private readonly __beforeScopeUpdateListener: () => void

    private __updateCount = 0

    public constructor(historyManager: HistoryManager, scope: S) {
        super(Place.ROOT, historyManager)

        this.__scope = scope

        this.__beforeScopeUpdateListener = () => {
            try {
                this.onBeforeScopeUpdate()
            } finally {
                this.__updateCount = 0
            }
        }

        this.__scopeUpdateManager = new ScopeUpdateManager(scope)
        this.__scopeUpdateManager.addOnBeforeScopeUpdateListener(this.__beforeScopeUpdateListener)

        this.__scopeUpdateManager.update(scope)

        this.__scope.update = this.update
    }

    public override release() {
        this.__scope.update = NOOP_VOID
        this.__scope.forceUpdate = NOOP_VOID
        this.__scopeUpdateManager.removeOnBeforeScopeUpdateListener(this.__beforeScopeUpdateListener)
        this.__scopeUpdateManager.release()
        super.release()
    }

    // :: Properties

    public get scope(): S {
        return this.__scope
    }

    public get updateManager(): IUpdateManager {
        return this.__scopeUpdateManager
    }

    // :: Application Extensions

    protected override publishAllParameters(uri: PlaceUri) {
        this.publishParameters(uri)
        super.publishAllParameters(uri)
    }

    protected override async applyPathParameters(context: FlipContext, atLevel: number) {
        try {
            const uri = context.targetUri
            const last = uri.place.id === -1
            const ok = await this.applyParameters(uri, false, last) && !last
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

    // :: IPresenter Api

    public readonly update = this.doUpdate.bind(this)

    private doUpdate(optionalScope?: Scope) {
        this.__scopeUpdateManager.update(optionalScope ?? this.scope)
        this.__updateCount++
    }

    public updateIfNotDirty(scope: Scope): void {
        if (this.__updateCount === 0) {
            this.doUpdate(scope)
        }
    }

    public onBeforeScopeUpdate(): void {
        // NOOP
    }

    // :: ICubePresenter Api

    public async applyParameters(uri: PlaceUri, initialization: boolean, last: boolean): Promise<boolean> {
        LOG.debug(`applyParameters(uri=${uri}, initialization=${initialization}, last=${last}`)
        return true
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public publishParameters(uri: PlaceUri): void {
        // NOOP
    }

}