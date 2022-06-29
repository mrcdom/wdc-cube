import React, { useCallback } from 'react'
import clsx from 'clsx'

import { Logger } from 'wdc-cube'
import { ViewSlot, bindUpdate } from 'wdc-cube-react'

import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import AppBar from '@mui/material/AppBar'
import Dialog from '@mui/material/Dialog'
import Button from '@mui/material/Button'
import MenuIcon from '@mui/icons-material/Menu'

import Css from './Main.module.css'
import { MainScope } from '../Main.scopes'
import { AlertView } from './AlertView'

const LOG = Logger.get('MainView')

export type MainViewProps = {
  className?: string
  scope: MainScope
}

export function MainView({ className, scope }: MainViewProps) {
  bindUpdate(React, scope)

  LOG.debug('update')

  // Read: https://dmitripavlutin.com/dont-overuse-react-usecallback/
  const onHome = useCallback(scope.onHome, [scope.onHome])
  const onOpenTodos = useCallback(scope.onOpenTodos, [scope.onOpenTodos])
  const onOpenSuscriptions = useCallback(scope.onOpenSuscriptions, [scope.onOpenSuscriptions])
  const onLogin = useCallback(scope.onLogin, [scope.onLogin])
  const onCloseDialog = useCallback(() => scope.dialog?.onClose(), [scope.dialog?.onClose])
  const onCloseAlert = useCallback(() => scope.alert?.onClose(), [scope.alert?.onClose])

  return <>
    <div className={clsx(className, Css.MainView)} >
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" className={Css.appBarMenuButton} color="inherit" aria-label="menu">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" className={Css.appBarTitle}>
            Cube Framework (Tutorial Example)
          </Typography>
          <Button color="inherit" onClick={onHome}>Home</Button>
          <Button color="inherit" onClick={onOpenTodos}>Todos</Button>
          <Button color="inherit" onClick={onOpenSuscriptions}>Subscriptions</Button>
          <Button color="inherit" onClick={onLogin}>Login</Button>
        </Toolbar>
      </AppBar>

      <ViewSlot className={Css.Body} scope={scope.body} optional={false} />

      <Dialog open={!!scope.dialog} onClose={onCloseDialog} aria-labelledby="form-dialog-title">
        <ViewSlot scope={scope.dialog} />
      </Dialog>

      <Dialog open={!!scope.alert} onClose={onCloseAlert} aria-labelledby="form-dialog-title">
        <ViewSlot scope={scope.alert} view={AlertView} />
      </Dialog>
    </div>
  </>
}
