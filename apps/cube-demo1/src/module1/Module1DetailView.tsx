import React from 'react'
import { CubeComponent } from 'wdc-cube-react'
import { Module1DetailScope } from './Module1DetailPresenter'

export class Module1DetailView extends CubeComponent<Module1DetailScope> {

  public override render() {
    return <>
      <div style={{ backgroundColor: 'yellow', padding: 20 }}>
        Module1Detail
      </div>
    </>
  }

}