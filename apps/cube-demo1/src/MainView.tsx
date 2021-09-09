import React from 'react'
import { ReactComponent, ViewFactory, PageHistoryManager } from 'wdc-cube-react'
import logo from './logo.svg'
import style from './Main.module.css'

import { MainPresenter } from './MainPresenter'

export class MainView extends ReactComponent {

  private app?: MainPresenter

  protected override attached() {
    this.app = new MainPresenter(new PageHistoryManager())
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