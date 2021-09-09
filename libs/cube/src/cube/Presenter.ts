import { NOOP_VOID } from './Constants'
import { Application } from './Application'
import { PlaceUri } from './PlaceUri'
import type { Scope } from './Scope'

/* eslint-disable @typescript-eslint/no-unused-vars */

export type PresenterType = Presenter<Application, Scope>
export type PresenterMapType = Map<number, PresenterType>
export type PresenterContructor<A extends Application> = { new(app: A): PresenterType }
export type PresenterFactory = (app: Application) => PresenterType

export class Presenter<A extends Application, S extends Scope> {

    protected readonly app: A

    public readonly scope: S

    public constructor(app: A, scope: S) {
        this.app = app
        this.scope = scope
    }

    public release(): void {
        this.scope.update = NOOP_VOID
    }

    public async applyParameters(uri: PlaceUri, initialization: boolean, deepest: boolean): Promise<boolean> {
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