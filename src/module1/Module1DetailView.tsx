import React from 'react'
import { WebFlowComponent } from '../webflow-react'
import { Module1DetailScope } from './Module1DetailPresenter'

export class Module1DetailView extends WebFlowComponent<Module1DetailScope> {

  public override render() {
    return <>
      <div style={{ backgroundColor: 'yellow', padding: 20 }}>
        Module1Detail
      </div>
    </>
  }

}