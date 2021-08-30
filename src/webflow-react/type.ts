import { IPresenter } from '../webflow/type'

export interface IViewFactory {
    // eslint-disable-next-line no-unused-vars
    (presenter: IPresenter): JSX.Element
}