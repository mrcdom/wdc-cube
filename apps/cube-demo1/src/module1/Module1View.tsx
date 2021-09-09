import React from 'react'
import { CubeComponent, ViewFactory } from 'wdc-cube-react'
import { Module1Scope } from './Module1Presenter'

export class Module1View extends CubeComponent<Module1Scope> {

  public override render() {
    const scope = this.props.scope
    const detailView = ViewFactory.createView(scope.detail)

    return <>
      <div style={{ backgroundColor: 'red', padding: 20 }}>
        {detailView}
      </div>
    </>
  }

}