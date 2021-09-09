import React from 'react'
import { getOrCreateApplication, ViewFactory, PageHistoryManager } from 'wdc-cube-react'
import logo from './logo.svg'
import style from './Main.module.css'

import { MainPresenter } from './MainPresenter'

const createApp = () => new MainPresenter(new PageHistoryManager())

export function MainView() {
  const { scope } = getOrCreateApplication(React, createApp)

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
}