import React from 'react'
import clsx from 'clsx'
import { NOOP_PROMISE_VOID } from 'wdc-cube'
import { getOrCreateApplication, ViewFactory, PageHistoryManager, IViewProps } from 'wdc-cube-react'
import { MainPresenter } from './Main.presenter'
import Dialog from '@material-ui/core/Dialog'
import { Button } from '@material-ui/core'
import Css from './Main.module.css'

// HistoryManager

const createApp = MainPresenter.create.bind(undefined, new PageHistoryManager(true))

export type MainViewProps = IViewProps<HTMLDivElement>

export function MainView({ className, ...props }: MainViewProps) {
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
    <div className={clsx(className, Css.MainView)} {...props}>
      <div className={Css.Bar}>
        <Button color="primary" className={Css.BtnFirst} onClick={scope.onRoot}>Home</Button>
        <Button color="primary" className={Css.BtnOthers} onClick={scope.onModule1}>Todos</Button>
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