import Logger from '../utils/logger'
import { IViewState, IViewStateSlot, WFBasePresenter, IParams, IPlace } from '../webflow'
import { ViewIds } from '../Common'
import { ApplicationPresenter } from '../ApplicationPresenter'

const LOG = Logger.get('Module2')

export interface Module2ViewState extends IViewState {
    presenter: Module2Presenter
    detail?: IViewState
}

export class Module2Presenter extends WFBasePresenter<ApplicationPresenter, Module2ViewState> {

    private readonly ownerSlot: IViewStateSlot

    public constructor(app: ApplicationPresenter, place: IPlace) {
        super(app, place, ViewIds.module2)

        this.ownerSlot = state => {
            this.state.detail = state
            this.update()
        }
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