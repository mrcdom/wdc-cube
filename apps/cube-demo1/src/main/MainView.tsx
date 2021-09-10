import React from 'react'
import { NOOP_PROMISE_VOID } from 'wdc-cube'
import { getOrCreateApplication, ViewFactory, PageHistoryManager } from 'wdc-cube-react'
import { MainPresenter } from './MainPresenter'
import Dialog from '@material-ui/core/Dialog'
import { Button } from '@material-ui/core'
import Css from './MainView.module.css'

const createApp = MainPresenter.create.bind(undefined, new PageHistoryManager())


export function MainView() {
  const { scope } = getOrCreateApplication(React, createApp)

  let bodyView = ViewFactory.createView(scope.body, { className: Css.Body })
  if (!bodyView) {
    bodyView = <div className={Css.Body}></div>
  }

  const dialogOnClose = scope.dialog?.onClose ?? NOOP_PROMISE_VOID
  const dialogView = ViewFactory.createView(scope.dialog)

  const alertOnClose = scope.alert?.onClose ?? NOOP_PROMISE_VOID
  const alertView = ViewFactory.createView(scope.alert)

  return <>
    <div className={Css.View}>
      <div className={Css.Bar}>
        <Button color="primary" className={Css.BtnFirst} onClick={scope.onRoot}>Home</Button>
        <Button color="primary" className={Css.BtnOthers} onClick={scope.onModule1}>Module1</Button>
        <Button color="primary" className={Css.BtnOthers} onClick={scope.onModule1Detail}>Module1-Detail</Button>
        <Button color="primary" className={Css.BtnOthers} onClick={scope.onModule2}>Subscriptions</Button>
      </div>

      {bodyView}

      <Dialog open={!!dialogView} onClose={dialogOnClose} aria-labelledby="form-dialog-title">
        {dialogView}
      </Dialog>

      <Dialog open={!!alertView} onClose={alertOnClose} aria-labelledby="form-dialog-title">
        {alertView}
      </Dialog>
    </div>
  </>
}