import { Logger } from '../utils/Logger'
import { NOOP_VOID } from '../utils/EmptyFunctions'
import { Application } from './Application'
import { Place } from './Place'
import { FlipIntent, ValidParamTypes } from './FlipIntent'
import { Scope } from './Scope'
import { ScopeUpdateManager } from './Presenter'

import type { ICubePresenter, IUpdateManager, AlertSeverity } from './IPresenter'

const LOG = Logger.get('CubePresenter')

export type PresenterContructor<A extends Application> = { new (app: A): ICubePresenter }

export const CubePresenterInternals = {
    uninitialized: true,
    release: NOOP_VOID as (this: ICubePresenter) => void
}

export class CubePresenter<A extends Application, S extends Scope> implements ICubePresenter {
    // :: Private Fields

    private readonly __app: A

    private readonly __scope: S

    private readonly __updateManager: IUpdateManager

    private readonly __beforeScopeUpdateListener: () => void

    private __updateCount = 0

    private __releasePhase = 0

    public constructor(app: A, scope: S) {
        if (CubePresenterInternals.uninitialized) {
            CubePresenterInternals.release = this.internalRelease
            CubePresenterInternals.uninitialized = false
        }

        this.__app = app
        this.__scope = scope

        this.__beforeScopeUpdateListener = () => {
            try {
                this.onBeforeScopeUpdate()
            } finally {
                this.__updateCount = 0
            }
        }

        this.__updateManager = new ScopeUpdateManager(scope)

        this.__updateManager.addOnBeforeScopeUpdateListener(this.__beforeScopeUpdateListener)
        this.__updateManager.update(scope)

        this.__scope.update = this.update
    }

    // :: IDisposable API

    private internalRelease(): void {
        try {
            this.release()
        } finally {
            this.__releasePhase = 2
        }
    }

    public release(): void {
        this.__releasePhase = 1
        this.__scope.update = NOOP_VOID
        this.__scope.forceUpdate = NOOP_VOID
        this.__updateManager.release()
        this.__releasePhase = 2
    }

    // :: IPresenter API

    public get isReleasing(): boolean {
        return this.__releasePhase === 1
    }

    public get isReleased(): boolean {
        return this.__releasePhase > 0
    }

    public get scope(): S {
        return this.__scope
    }

    public get app(): A {
        return this.__app
    }

    public get updateManager(): IUpdateManager {
        return this.__updateManager
    }

    public unexpected(message: string, error: unknown): void {
        this.__app.unexpected(message, error)
    }

    public alert(severity: AlertSeverity, title: string, message: string, onClose?: () => Promise<void>) {
        this.__app.alert(severity, title, message, onClose)
    }

    public readonly update = this.doUpdate.bind(this)

    private doUpdate(optionalScope?: Scope) {
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

    // :: ICubePresenter Api

    public async applyParameters(intent: FlipIntent, initialization: boolean, last: boolean): Promise<boolean> {
        LOG.debug(`applyParameters(intent=${intent}, initialization=${initialization}, last=${last}`)
        return true
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public publishParameters(intent: FlipIntent): void {
        // NOOP
    }

    public updateHistory(): void {
        this.__app.updateHistory()
    }

    public async flip(
        place: Place,
        args?: { params?: Record<string, ValidParamTypes>; attrs?: Record<string, unknown> }
    ): Promise<void> {
        this.__app.flip(place, args)
    }

    public async flipToIntent(intent: FlipIntent): Promise<void> {
        this.__app.flipToIntent(intent)
    }

    public async flipToIntentString(sIntent: string): Promise<void> {
        this.__app.flipToIntentString(sIntent)
    }
}
