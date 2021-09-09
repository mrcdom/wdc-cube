import React from 'react'
import { WebFlowComponent, WebFlowViewFactory } from 'wdc-cube-react'
import { Module2Scope } from './Module2Presenter'

export class Module2View extends WebFlowComponent<Module2Scope> {

    public override render() {
        const scope = this.props.scope
        const detailView = WebFlowViewFactory.createView(scope.detail)

        return <>
            <div style={{ backgroundColor: 'blue', padding: 20 }}>
                {detailView}
            </div>
        </>
    }

}