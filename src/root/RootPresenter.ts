import { IViewState, WFBasePresenter, IParams, IPlace, IViewStateSlot } from '../webflow'
import Logger from '../utils/logger'
import { ViewIds } from '../Common'
import { ApplicationPresenter } from '../ApplicationPresenter'

const LOG = Logger.get('Root')

export interface RootViewState extends IViewState {
    presenter: RootPresenter
    module?: IViewState
}

export class RootPresenter extends WFBasePresenter<ApplicationPresenter, RootViewState> {

    private readonly ownerSlot: IViewStateSlot

    public constructor(app: ApplicationPresenter, place: IPlace) {
        super(app, place, ViewIds.root)

        this.ownerSlot = state => {
            this.state.module = state
            this.update()
        }
    }

    public override applyParams(target: IPlace, params: IParams, initializing: boolean) {
        if (initializing) {
            LOG.info('Initialized')
        }

        if (this.place === target) {
            this.state.module = undefined
        }

        params.ownerSlot = this.ownerSlot

        return true
    }

    public async onModule1Clicked() {
        try {
            await this.app.go(this.app.router.module1, {})
        } catch (caught) {
            LOG.error('onModule1Clicked', caught)
        } finally {
            this.update()
        }
    }

    public async onModule1DetailClicked() {
        try {
            await this.app.go(this.app.router.module1Detail, {})
        } catch (caught) {
            LOG.error('onModule1DetailClicked', caught)
        } finally {
            this.update()
        }
    }

    public async onModule2Clicked() {
        try {
            await this.app.go(this.app.router.module2, {})
        } catch (caught) {
            LOG.error('onModule2Clicked', caught)
        } finally {
            this.update()
        }
    }

    public async onModule2DetailClicked() {
        try {
            await this.app.go(this.app.router.module2Detail, {})
        } catch (caught) {
            LOG.error('onModule2DetailClicked', caught)
        } finally {
            this.update()
        }
    }

}