import React from 'react'
import { WFViewFactory, WFComponent } from './webflow-react'
import logo from './logo.svg'
import style from './Application.module.css'

import { ViewIds } from './Common'
import { ApplicationPresenter } from './ApplicationPresenter'
import { RootView } from './root/RootView'
import { Module1View } from './module1/Module1View'
import { Module1DetailView } from './module1/Module1DetailView'
import { Module2View } from './module2/Module2View'
import { Module2DetailView } from './module2/Module2DetailView'

WFViewFactory.register(ViewIds.root, RootView.factory)
WFViewFactory.register(ViewIds.module1, Module1View.factory)
WFViewFactory.register(ViewIds.module1Detail, Module1DetailView.factory)
WFViewFactory.register(ViewIds.module2, Module2View.factory)
WFViewFactory.register(ViewIds.module2Detail, Module2DetailView.factory)

export class ApplicationView extends WFComponent<ApplicationPresenter> {

  render() {
    const app = this.props.presenter
    const rootView = WFViewFactory.createView(app.router.rootPresenter?.state)

    return <>
      <div className={style.App}>
        <div className={style.AppHeader}>
          <img src={logo} className={style.AppLogo} alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        {rootView}
      </div>
    </>
  }
}