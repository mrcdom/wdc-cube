import { Logger } from '../utils/Logger'
import { Application } from './Application'
import { Place } from './Place'
import { PlaceUri, ValidParamTypes } from './PlaceUri'
import { Scope } from './Scope'
import { Presenter } from './Presenter'

import { AlertSeverity, ICubePresenter, IPresenter, IUpdateManager } from './IPresenter'

const LOG = Logger.get('Presenter')

export type PresenterContructor<A extends Application> = { new(app: A): ICubePresenter }

export class CubePresenter<A extends Application, S extends Scope> extends Presenter<S> implements IPresenter, ICubePresenter {
    private presenterEngine: Presenter<S>;
    public constructor(app: A, scope: S) {
        super(app, scope)
        this.presenterEngine = new Presenter(app, scope)
    }
    get scope(): S {
        return this.presenterEngine.scope;
    }
    get updateManager(): IUpdateManager {
        return this.presenterEngine.updateManager;
    }
    update(optionalScope?: Scope): void {
        return this.presenterEngine.update(optionalScope);
    }
    updateIfNotDirty(scope: Scope): void {
        return this.presenterEngine.updateIfNotDirty(scope);
    }
    onBeforeScopeUpdate(): void {
        return this.presenterEngine.onBeforeScopeUpdate();
    }
    unexpected(message: string, error: unknown): void {
        return this.presenterEngine.unexpected(message, error);
    }
    alert(severity: AlertSeverity, title: string, message: string, onClose?: () => Promise<void>): void {
        return this.presenterEngine.alert(severity, title, message, onClose);
    }
    release(): void {
        return this.presenterEngine.release();
    }

    public get app(): A {
        return this.presenterEngine.owner as A
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public publishParameters(uri: PlaceUri): void {
        // NOOP
    }

}