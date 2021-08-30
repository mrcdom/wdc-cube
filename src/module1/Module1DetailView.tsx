import React from 'react'
import { WFComponent } from '../webflow-react'
import { Module1DetailPresenter } from './Module1DetailPresenter'

export class Module1DetailView extends WFComponent<Module1DetailPresenter> {

  public static readonly factory = (presenter: Module1DetailPresenter) => (
    <Module1DetailView presenter={presenter} />
  )

  render() {
    return <>
      <div style={{ backgroundColor: 'yellow', padding: 20 }}>
      </div>
    </>
  }

}