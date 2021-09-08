import React from 'react'
import { ReactComponent, WebFlowViewFactory, WebFlowURLHistoryManager } from './webflow-react'
import logo from './logo.svg'
import style from './Application.module.css'

import { ViewIds } from './Common'
import { ApplicationPresenter } from './ApplicationPresenter'
import { RootView } from './root/RootView'
import { Module1View } from './module1/Module1View'
import { Module1DetailView } from './module1/Module1DetailView'
import { Module2View } from './module2/Module2View'
import { Module2DetailView } from './module2/Module2DetailView'

{ // View Registration
  const wff = WebFlowViewFactory
  wff.register(ViewIds.root, RootView)
  wff.register(ViewIds.module1, Module1View)
  wff.register(ViewIds.module1Detail, Module1DetailView)
  wff.register(ViewIds.module2, Module2View)
  wff.register(ViewIds.module2Detail, Module2DetailView)
}

export class ApplicationView extends ReactComponent {

  private app?: ApplicationPresenter

  protected override attached() {
    this.app = new ApplicationPresenter(new WebFlowURLHistoryManager())
    this.app.scope.update = this.newUpdateCallback()
    this.app.initialize()
  }

  protected override detached() {
    if (this.app) {
      this.app.release()
      this.app = undefined
    }
  }

  public override render() {
    if (this.app) {
      const scope = this.app.scope
      const rootView = WebFlowViewFactory.createView(scope.root)

      return <>
        <div className={style.App}>
          <div className={style.AppHeader}>
            <img src={logo} className={style.AppLogo} alt="logo" />
            <h2>Welcome to React</h2>
          </div>
          {rootView}
        </div>
      </>
    } else {
      return <div>Initializing...</div>
    }
  }

}