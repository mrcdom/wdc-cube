import { NOOP_VOID } from './Constants'
import { Application } from './Application'
import { Place } from './Place'
import { PlaceUri, ValidParamTypes } from './PlaceUri'
import { Scope } from './Scope'

import type { IPresenter } from './IPresenter'
import type { AlertSeverity } from './Application'
import { Logger } from '../utils/Logger'

const LOG = Logger.get('Presenter')

export type PresenterMapType = Map<number, IPresenter>
export type PresenterFactory = (app: Application) => IPresenter

export type PresenterType = Presenter<Application, Scope>
export type PresenterContructor<A extends Application> = { new(app: A): PresenterType }

export class Presenter<A extends Application, S extends Scope> implements IPresenter {

    protected readonly app: A

    public readonly scope: S

    private readonly __dirtyScopes: Map<string, Scope>

    private __dirtyHandler?: NodeJS.Timeout

    private __runningOnBeforeScopeUpdate = false

    public constructor(app: A, scope: S) {
        this.app = app
        this.scope = scope
        this.__dirtyScopes = new Map()

        this.update(this.scope)
    }

    public release(): void {
        this.scope.update = NOOP_VOID
        this.__dirtyScopes.clear()
        this.cancelDirtyScopesUpdate()
    }

    private cancelDirtyScopesUpdate() {
        if (this.__dirtyHandler) {
            clearTimeout(this.__dirtyHandler)
            this.__dirtyHandler = undefined
        }
    }

    protected unexpected(message: string, error: unknown) {
        this.app.unexpected(message, error)
        this.app.alert('error', 'Unexpected error', message)
    }

    public alert(severity: AlertSeverity, title: string, message: string, onClose?: () => Promise<void>) {
        this.app.alert(severity, title, message, onClose)
    }

    protected async flip(place: Place, args?: { params?: Record<string, ValidParamTypes>; attrs?: Record<string, unknown> }) {
        return this.app.flip(place, args)
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async applyParameters(uri: PlaceUri, initialization: boolean, deepest?: boolean): Promise<boolean> {
        return true
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public publishParameters(uri: PlaceUri): void {
        // NOOP
    }

    public onBeforeScopeUpdate(): void {
        // NOOP
    }

    protected update<T extends Scope>(scope: T) {
        if (this.__runningOnBeforeScopeUpdate) {
            this.__dirtyScopes.set(scope.vid, scope)
        } else {
            this.cancelDirtyScopesUpdate()
            this.__dirtyScopes.set(scope.vid, scope)
            this.__dirtyHandler = setTimeout(this.__doUpdateDirtyScopes, 16)
        }
    }

    public emitBeforeScopeUpdate(): void {
        try {
            this.cancelDirtyScopesUpdate()

            try {
                this.__runningOnBeforeScopeUpdate = true
                this.onBeforeScopeUpdate()
            } finally {
                this.__runningOnBeforeScopeUpdate = false
            }

            for (const scope of this.__dirtyScopes.values()) {
                scope.update()
            }
        } catch (caught) {
            LOG.error('Updating dirty scopes')
        } finally {
            this.__dirtyScopes.clear()
        }
    }

    private __doUpdateDirtyScopes = () => {
        this.emitBeforeScopeUpdate()
    }

}

export function newPresenterFactory<A extends Application>(ctor: PresenterContructor<A>): PresenterFactory {
    return (app) => {
        return new ctor((app as unknown) as A)
    }
}