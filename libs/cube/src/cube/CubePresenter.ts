import { Logger } from '../utils/Logger'
import { NOOP_VOID } from '../utils/EmptyFunctions'
import { Application } from './Application'
import { Place } from './Place'
import { PlaceUri, ValidParamTypes } from './PlaceUri'
import { Scope } from './Scope'
import { ScopeUpdateManager } from './Presenter'

import type { ICubePresenter, IUpdateManager, AlertSeverity } from './IPresenter'

const LOG = Logger.get('CubePresenter')

export type PresenterContructor<A extends Application> = { new(app: A): ICubePresenter }

export class CubePresenter<A extends Application, S extends Scope> implements ICubePresenter {

    // :: Private Fields

    private readonly __app: A

    private readonly __scope: S

    private readonly __updateManager: IUpdateManager

    private readonly __beforeScopeUpdateListener: () => void

    private __updateCount = 0

    public constructor(app: A, scope: S) {
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
    }

    // :: IDisposable API

    public release(): void {
        this.scope.update = NOOP_VOID
        this.__updateManager.release()
    }

    // :: IPresenter API

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

    public update(optionalScope?: Scope) {
        this.__updateManager.update(optionalScope ?? this.scope)
        this.__updateCount++
    }

    public updateIfNotDirty(scope: Scope) {
        if (this.__updateCount === 0) {
            this.update(scope)
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

    public updateHistory(): void {
        this.__app.updateHistory()
    }

    public async flip(place: Place, args?: { params?: Record<string, ValidParamTypes>; attrs?: Record<string, unknown> }): Promise<void> {
        this.__app.flip(place, args)
    }

    public async flipToUri(uri: PlaceUri): Promise<void> {
        this.__app.flipToUri(uri)
    }

    public async flipToUriString(suri: string): Promise<void> {
        this.__app.flipToUriString(suri)
    }

}