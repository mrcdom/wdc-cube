import Logger from '../utils/logger'
import { IBasePresenter, IPresenter, IPlace, IParams, IViewState } from './type'
import { nullFunc } from './util'

const LOG = Logger.get('WFApplication')

export class WFApplication implements IPresenter {

    public readonly state: IViewState

    public update: () => void

    public presenters: Record<string, IBasePresenter> = {}

    public constructor() {
        this.state = {vid: 'app', presenter: this}
        this.update = nullFunc

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as Record<string, any>).app = this
        }
    }

    public release() {
        this.presenters = {}
    }

    public newRootPlace(presenterClass: () => IBasePresenter, name: string): IPlace {
        return this.newPlace(async () => true, presenterClass, name)
    }

    public newPlace(previous: IPlace, presenterClass: () => IBasePresenter, name: string): IPlace {
        return async (oldPresenters: Record<string, IBasePresenter>, newPresenters: Record<string, IBasePresenter>, target: IPlace, params: IParams) => {
            if (await previous.call(this, oldPresenters, newPresenters, target, params)) {
                let presenter = newPresenters[name] = oldPresenters[name]
                if (!presenter) {
                    presenter = newPresenters[name] = presenterClass()
                    return Promise.resolve(presenter.applyParams(target, params, true))
                } else {
                    return Promise.resolve(presenter.applyParams(target, params, false))
                }
            }
            return Promise.resolve(false)
        }
    }

    public async go(place: IPlace, params: IParams) {
        const newPresenters = {} as Record<string, IBasePresenter>
        const oldPresenters = this.presenters
        await place.call(this, oldPresenters, newPresenters, place, params || {})
        this.presenters = newPresenters

        for (const key of Object.keys(newPresenters)) {
            delete oldPresenters[key]
        }

        for (const key of Object.keys(oldPresenters)) {
            const presenter = oldPresenters[key]
            if (presenter) {
                try {
                    presenter.release()
                } catch (caught) {
                    LOG.error('Releasing presenter', caught)
                }
            }
        }
    }

}