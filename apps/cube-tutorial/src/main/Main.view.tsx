import React, { useCallback } from 'react'
import clsx from 'clsx'
import { Logger } from 'wdc-cube'
import { getOrCreateApplication, ViewSlot, PageHistoryManager, IViewProps } from 'wdc-cube-react'
import Typography from '@material-ui/core/Typography'
import IconButton from '@material-ui/core/IconButton'
import Toolbar from '@material-ui/core/Toolbar'
import AppBar from '@material-ui/core/AppBar'
import Dialog from '@material-ui/core/Dialog'
import { Button } from '@material-ui/core'
import MenuIcon from '@material-ui/icons/Menu'
import Css from './Main.module.css'
import { MainPresenter } from './Main.presenter'

const LOG = Logger.get('MainView')

// HistoryManager

const createApp = () => new MainPresenter(new PageHistoryManager(true))

export type MainViewProps = IViewProps

export function MainView({ className, ...props }: MainViewProps) {
  const { scope } = getOrCreateApplication(React, createApp)

  LOG.debug('update')

  // Read: https://dmitripavlutin.com/dont-overuse-react-usecallback/
  const onHome = useCallback(scope.onHome, [scope.onHome])
  const onOpenTodos = useCallback(scope.onOpenTodos, [scope.onOpenTodos])
  const onOpenSuscriptions = useCallback(scope.onOpenSuscriptions, [scope.onOpenSuscriptions])
  const onLogin = useCallback(scope.onLogin, [scope.onLogin])
  const onCloseDialog = useCallback(() => scope.dialog?.onClose(), [scope.dialog])
  const onCloseAlert = useCallback(() => scope.alert?.onClose(), [scope.dialog])

  return <>
    <div className={clsx(className, Css.MainView)} {...props}>
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
        <ViewSlot scope={scope.alert} />
      </Dialog>
    </div>
  </>
}
