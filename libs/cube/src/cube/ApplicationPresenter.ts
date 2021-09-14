import { Logger } from '../utils/Logger'
import { Place } from './Place'
import { PlaceUri } from './PlaceUri'
import { HistoryManager } from './HistoryManager'
import { Application } from './Application'
import { NavigationContext } from './NavigationContext'
import { Scope } from './Scope'
import { Presenter } from './Presenter'
import type { IPresenter } from './IPresenter'

const LOG = Logger.get('ApplicationPresenter')

export class ApplicationPresenter<S extends Scope> extends Application implements IPresenter {

    private readonly __presenter: InternalApplicationPresenter<S, ApplicationPresenter<S>>

    public constructor(rootPlace: Place, historyManager: HistoryManager, scope: S) {
        super(rootPlace, historyManager)
        this.__presenter = new InternalApplicationPresenter<S, ApplicationPresenter<S>>(this, scope)
    }

    public get scope() {
        return this.__presenter.scope
    }

    public override release() {
        this.__presenter.release()
        super.release()
    }

    protected override publishAllParameters(uri: PlaceUri) {
        this.publishParameters(uri)
        super.publishAllParameters(uri)
    }

    protected override async applyPathParameters(context: NavigationContext, atLevel: number) {
        const uri = context.targetUri

        try {
            const ok = await this.applyParameters(uri, false, uri.place.id === -1)
            if (!ok) {
                return
            }
        } catch (caught) {
            if (this.fallbackPlace !== this.rootPlace) {
                LOG.error('Failed navigating just on root presenter. Going to fallback place', caught)
                this.flip(this.fallbackPlace)
            } else {
                LOG.error('Failed navigating just on root presenter. Nothing can be done!', caught)
            }
            return
        }
        super.applyPathParameters(context, atLevel)
    }

    public update<T extends Scope>(optionalScope?: T) {
        this.__presenter.update(optionalScope ?? this.scope)
    }

    public emitBeforeScopeUpdate(): void {
        this.__presenter.emitBeforeScopeUpdate()
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async applyParameters(uri: PlaceUri, initialization: boolean, deepest: boolean): Promise<boolean> {
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

class InternalApplicationPresenter<S extends Scope, A extends ApplicationPresenter<S>> extends Presenter<A, S> {

    public constructor(app: A, scope: S) {
        super(app, scope)
    }

    public override onBeforeScopeUpdate(): void {
        this.app.onBeforeScopeUpdate()
    }

}