import { NOOP_VOID } from './Constants'
import { Application } from './Application'
import { Place } from './Place'
import { PlaceUri, ValidParamTypes } from './PlaceUri'
import { Scope } from './Scope'
import type { IPresenter } from './IPresenter'

/* eslint-disable @typescript-eslint/no-unused-vars */

export type PresenterMapType = Map<number, IPresenter>
export type PresenterFactory = (app: Application) => IPresenter

export type PresenterType = Presenter<Application, Scope>
export type PresenterContructor<A extends Application> = { new(app: A): PresenterType }

export class Presenter<A extends Application, S extends Scope> implements IPresenter {

    protected readonly app: A

    public readonly scope: S

    public constructor(app: A, scope: S) {
        this.app = app
        this.scope = scope
    }

    public release(): void {
        this.scope.update = NOOP_VOID
    }

    public async go(place: Place, args?: { params?: Record<string, ValidParamTypes>; attrs?: Record<string, unknown> }) {
        return this.app.go(place, args)
    }

    public async applyParameters(uri: PlaceUri, initialization: boolean, deepest?: boolean): Promise<boolean> {
        return true
    }

    public computeDerivatedFields(): void {
        // NOOP
    }

    public publishParameters(uri: PlaceUri): void {
        // NOOP
    }

}

export function newPresenterFactory<A extends Application>(ctor: PresenterContructor<A>): PresenterFactory {
    return (app) => {
        return new ctor((app as unknown) as A)
    }
}