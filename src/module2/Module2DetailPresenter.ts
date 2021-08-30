import Logger from '../utils/logger'
import { IViewState, WFBasePresenter, IParams, IPlace } from '../webflow'
import { ViewIds } from '../Common'
import { ApplicationPresenter } from '../ApplicationPresenter'

const LOG = Logger.get('Module2Detail')

export interface Module2DetailViewState extends IViewState {
    presenter: Module2DetailPresenter
}

export class Module2DetailPresenter extends WFBasePresenter<ApplicationPresenter, Module2DetailViewState> {

    public constructor(app: ApplicationPresenter, place: IPlace) {
        super(app, place, ViewIds.module2Detail)
    }

    public override release() {
        LOG.info('Finalized')
        super.release()
    }

    applyParams(target: IPlace, params: IParams, initializing: boolean) {
        if (initializing) {
            LOG.info('Initialized')
        }

        if (this.place === target) {
            // NOOP
        }

        params.ownerSlot(this.state)
        return true
    }

}

