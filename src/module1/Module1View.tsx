import React from 'react'
import { WebFlowComponent, WebFlowViewFactory } from '../webflow-react'
import { Module1Scope } from './Module1Presenter'

export class Module1View extends WebFlowComponent<Module1Scope> {

  public override render() {
    const scope = this.props.scope
    const detailView = WebFlowViewFactory.createView(scope.detail)

    return <>
      <div style={{ backgroundColor: 'red', padding: 20 }}>
        {detailView}
      </div>
    </>
  }

}