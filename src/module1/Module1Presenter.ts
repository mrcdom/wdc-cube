import Logger from '../utils/logger'
import { IViewState, IViewStateSlot, WFBasePresenter, IPlace, IParams } from '../webflow'
import { ViewIds } from '../Common'
import { ApplicationPresenter } from '../ApplicationPresenter'

const LOG = Logger.get('Module1')

export interface Module1ViewState extends IViewState {
    presenter: Module1Presenter
    detail?: IViewState
}

export class Module1Presenter extends WFBasePresenter<ApplicationPresenter, Module1ViewState> {

    private readonly ownerSlot: IViewStateSlot

    public constructor(app: ApplicationPresenter, place: IPlace) {
        super(app, place, ViewIds.module1)

        this.ownerSlot = state => {
            this.state.detail = state
            this.update()
        }
    }

    public override release() {
        LOG.info('Finalized')
        super.release()
    }

    public override applyParams(target: IPlace, params: IParams, initializing: boolean) {
        this.state.detail = undefined

        if (initializing) {
            LOG.info('Initialized')
        }

        if (this.place === target) {
            this.state.detail = undefined
        }

        params.ownerSlot(this.state)
        params.ownerSlot = this.ownerSlot

        return true
    }

}