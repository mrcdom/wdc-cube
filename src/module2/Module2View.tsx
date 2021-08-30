import React from 'react'
import { WFComponent, WFViewFactory } from '../webflow-react'
import { Module2Presenter } from './Module2Presenter'

export class Module2View extends WFComponent<Module2Presenter> {

    public static readonly factory = (presenter: Module2Presenter) => (
        <Module2View presenter={presenter} />
    )

    render() {
        const presenter = this.props.presenter
        const detailView = WFViewFactory.createView(presenter?.state.detail)

        return <>
            <div style={{ backgroundColor: 'blue', padding: 20 }}>
                {detailView}
            </div>
        </>
    }

}