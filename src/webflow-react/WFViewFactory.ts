import { IViewState } from '../webflow'
import { IPresenter } from '../webflow/type'
import { IViewFactory } from './type'

const viewFactoryMap: Record<string, IViewFactory> = {}

export class WFViewFactory {
    
    public static register<E extends IPresenter>(vid: string, 
        // eslint-disable-next-line no-unused-vars        
        factory: (state: E) => JSX.Element
    ) {
        viewFactoryMap[vid] = factory as IViewFactory
    }

    public static createView(state?: IViewState) {
        if (state && state.presenter) {
            return viewFactoryMap[state.vid](state.presenter)
        } else {
            return null
        }
    }
}