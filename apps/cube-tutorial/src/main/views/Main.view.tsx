import React, { useCallback } from 'react'
import clsx from 'clsx'
import { Logger } from 'wdc-cube'
import { getOrCreateApplication, ViewSlot, IViewProps } from 'wdc-cube-react'
import Typography from '@material-ui/core/Typography'
import IconButton from '@material-ui/core/IconButton'
import Toolbar from '@material-ui/core/Toolbar'
import AppBar from '@material-ui/core/AppBar'
import Dialog from '@material-ui/core/Dialog'
import { Button } from '@material-ui/core'
import MenuIcon from '@material-ui/icons/Menu'
import Css from './Main.module.css'
import { MainPresenter } from '../Main.presenter'
import { AlertView } from './AlertView'

const LOG = Logger.get('MainView')

export type MainViewProps = IViewProps & {
  presenterFactory: () => MainPresenter
}

export function MainView({ className, presenterFactory }: MainViewProps) {
  const { scope } = getOrCreateApplication(React, presenterFactory)

  LOG.debug('update')

  // Read: https://dmitripavlutin.com/dont-overuse-react-usecallback/
  const onHome = useCallback(scope.onHome, [scope.onHome])
  const onOpenTodos = useCallback(scope.onOpenTodos, [scope.onOpenTodos])
  const onOpenSuscriptions = useCallback(scope.onOpenSuscriptions, [scope.onOpenSuscriptions])
  const onLogin = useCallback(scope.onLogin, [scope.onLogin])
  const onCloseDialog = useCallback(() => scope.dialog?.onClose(), [scope.dialog])
  const onCloseAlert = useCallback(() => scope.alert?.onClose(), [scope.dialog])

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
