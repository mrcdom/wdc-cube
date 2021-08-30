import Logger from '../utils/logger'
import { IViewState, WFBasePresenter, IParams } from '../webflow'
import { ViewIds } from '../Common'
import { ApplicationPresenter } from '../ApplicationPresenter'
import { IPlace } from '../webflow'

const LOG = Logger.get('Module1Detail')

export interface Module1DetailViewState extends IViewState {
    presenter: Module1DetailPresenter
}

export class Module1DetailPresenter extends WFBasePresenter<ApplicationPresenter, Module1DetailViewState> {

    public constructor(app: ApplicationPresenter, place: IPlace) {
        super(app, place, ViewIds.module1Detail)
    }

    public override release() {
        LOG.info('Finalized')
        super.release()
    }

    public override applyParams(target: IPlace, params: IParams, initializing: boolean) {
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