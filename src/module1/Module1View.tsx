import React from 'react'
import { WFComponent, WFViewFactory } from '../webflow-react'
import { Module1Presenter } from './Module1Presenter'

export class Module1View extends WFComponent<Module1Presenter> {

  public static readonly factory = (presenter: Module1Presenter) => (
    <Module1View presenter={presenter} />
  )

  render() {
    const presenter = this.props.presenter
    const detailView = WFViewFactory.createView(presenter.state.detail)

    return <>
      <div style={{ backgroundColor: 'red', padding: 20 }}>
        {detailView}
      </div>
    </>
  }

}