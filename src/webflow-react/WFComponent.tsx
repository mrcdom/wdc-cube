import React from 'react'
import { IPresenter, nullFunc } from '../webflow'

export interface IBaseComponentProps<P extends IPresenter> {
    presenter: P
}

export class WFComponent<P extends IPresenter>
    extends React.Component<IBaseComponentProps<P>> {

    UNSAFE_componentWillMount() {
        this.props.presenter.update = () => this.forceUpdate()
    }

    componentWillUnmount() {
        this.props.presenter.update = nullFunc
    }

}