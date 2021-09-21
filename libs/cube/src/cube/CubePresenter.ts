import { Logger } from '../utils/Logger'
import { Application } from './Application'
import { Place } from './Place'
import { PlaceUri, ValidParamTypes } from './PlaceUri'
import { Scope } from './Scope'
import { Presenter } from './Presenter'

import type { ICubePresenter } from './IPresenter'

const LOG = Logger.get('Presenter')

export type PresenterFactory = (app: Application) => ICubePresenter

export type PresenterType = CubePresenter<Application, Scope>
export type PresenterContructor<A extends Application> = { new(app: A): PresenterType }

export class CubePresenter<A extends Application, S extends Scope> extends Presenter<S> implements ICubePresenter {

    public constructor(app: A, scope: S) {
        super(app, scope)
    }

    public get app(): A {
        return this.owner as A
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

export function newPresenterFactory<A extends Application>(ctor: PresenterContructor<A>): PresenterFactory {
    return (app) => {
        return new ctor((app as unknown) as A)
    }
}