import Logger from '../utils/logger'
import { IBasePresenter, IParams, IPlace, IViewState } from './type'
import { WFApplication } from './WFApplication'
import { nullFunc } from './util'

const LOG = Logger.get('WFBasePresenter')

export class WFBasePresenter<A extends WFApplication, E extends IViewState> implements IBasePresenter {

    protected readonly app: A

    protected readonly place: IPlace

    public update: () => void

    public readonly state: E

    public constructor(app: A, place: IPlace, vid: string) {
        this.app = app
        this.place = place
        this.update = nullFunc
        this.state = { vid } as E
        this.state.presenter = this
    }

    public release() {
        this.update = nullFunc
    }

    public onChanged() {
        // NOOP
    }

    public applyParams(target: IPlace, params: IParams, initializing: boolean) {
        LOG.debug('target: ', target)
        LOG.debug('params: ', params)
        LOG.debug('initializing: ', initializing)
        return true
    }

    public exportParams(params: IParams) {
        if (params) {
            // NOOP
        }
    }

}
