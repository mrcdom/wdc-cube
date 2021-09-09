import React from 'react'
import { ReactComponent, ViewFactory, PageHistoryManager } from 'wdc-cube-react'
import logo from './logo.svg'
import style from './Application.module.css'

import { ViewIds } from './Constants'
import { ApplicationPresenter } from './ApplicationPresenter'
import { RootView } from './root/RootView'
import { Module1View } from './module1/Module1View'
import { Module1DetailView } from './module1/Module1DetailView'
import { Module2View } from './module2/Module2View'
import { Module2DetailView } from './module2/Module2DetailView'

{ // View Registration
  const register = ViewFactory.register

  register(ViewIds.root, RootView)
  register(ViewIds.module1, Module1View)
  register(ViewIds.module1Detail, Module1DetailView)
  register(ViewIds.module2, Module2View)
  register(ViewIds.module2Detail, Module2DetailView)
}

export class ApplicationView extends ReactComponent {

  private app?: ApplicationPresenter

  protected override attached() {
    this.app = new ApplicationPresenter(new PageHistoryManager())
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
      const rootView = ViewFactory.createView(scope.root)

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