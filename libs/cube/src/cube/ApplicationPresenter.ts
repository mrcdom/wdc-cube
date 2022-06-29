import { Logger } from '../utils/Logger'
import { NOOP_VOID } from '../utils/EmptyFunctions'
import { Place } from './Place'
import { FlipIntent } from './FlipIntent'
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

    protected override publishAllParameters(intent: FlipIntent) {
        this.publishParameters(intent)
        super.publishAllParameters(intent)
    }

    protected override async applyPathParameters(context: FlipContext, atLevel: number) {
        const intent = context.targetIntent
        const last = intent.place.id === -1
        const ok = (await this.applyParameters(intent, false, last)) && !last
        if (!ok) {
            return
        }

        await super.applyPathParameters(context, atLevel)
    }

    // :: IPresenter Api

    public readonly update = this.doUpdate.bind(this)

    protected doUpdate(optionalScope?: Scope) {
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

    public async kickStart(safePlace: Place) {
        let intent = this.newIntentFromString(this.historyManager.location)
        try {
            await this.applyParameters(intent, true, intent.place === safePlace)
        } catch (caught) {
            // Intent could have been changed, so redirect to a safe place
            intent = intent.redirect(safePlace)
        }

        if (intent.place !== safePlace) {
            intent.attributes.clear()
            await this.flipToIntent(intent)
        }
    }

    public async applyParameters(intent: FlipIntent, initialization: boolean, last: boolean): Promise<boolean> {
        LOG.debug(`applyParameters(intent=${intent}, initialization=${initialization}, last=${last}`)
        return true
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public publishParameters(intent: FlipIntent): void {
        // NOOP
    }
}
