import React from 'react'
import clsx from 'clsx'
import { getOrCreateApplication, ViewSlot, PageHistoryManager, IViewProps } from 'wdc-cube-react'
import { MainPresenter } from './Main.presenter'
import Dialog from '@material-ui/core/Dialog'
import { Button } from '@material-ui/core'
import Css from './Main.module.css'

// HistoryManager

const createApp = MainPresenter.create.bind(undefined, new PageHistoryManager(true))

export type MainViewProps = IViewProps

export function MainView({ className, ...props }: MainViewProps) {
  const { scope } = getOrCreateApplication(React, createApp)

  return <>
    <div className={clsx(className, Css.MainView)} {...props}>
      <div className={Css.Bar}>
        <Button color="primary" className={Css.BtnFirst} onClick={scope.onHome}>Home</Button>
        <Button color="primary" className={Css.BtnOthers} onClick={scope.onOpenTodos}>Todos</Button>
        <Button color="primary" className={Css.BtnOthers} onClick={scope.onOpenSuscriptions}>Subscriptions</Button>
      </div>

      {scope.body
        ? <ViewSlot className={Css.Body} scope={scope.body} />
        : <div className={Css.Body}></div>}

      <Dialog open={!!scope.dialog} onClose={scope.dialog?.onClose} aria-labelledby="form-dialog-title">
        <ViewSlot scope={scope.dialog} />
      </Dialog>

      <Dialog open={!!scope.alert} onClose={scope.alert?.onClose} aria-labelledby="form-dialog-title">
        <ViewSlot scope={scope.alert} />
      </Dialog>
    </div>
  </>
}