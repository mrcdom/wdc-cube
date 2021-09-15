import React from 'react'
import clsx from 'clsx'
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

// HistoryManager

const createApp = MainPresenter.create.bind(undefined, new PageHistoryManager(true))

export type MainViewProps = IViewProps

export function MainView({ className, ...props }: MainViewProps) {
  const { scope } = getOrCreateApplication(React, createApp)

  const [drawerOpened, setDrawerOpened] = React.useState(false)

  return <>
    <div className={clsx(className, Css.MainView)} {...props}>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" className={Css.appBarMenuButton} color="inherit" aria-label="menu"
            onClick={() => setDrawerOpened(true)}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" className={Css.appBarTitle}>
            WeDoCode - Cube Framework (Tutorial Example)
          </Typography>
          <Button color="inherit" onClick={scope.onHome}>Home</Button>
          <Button color="inherit" onClick={scope.onOpenTodos}>Todos</Button>
          <Button color="inherit" onClick={scope.onOpenSuscriptions}>Subscriptions</Button>
          <Button color="inherit" onClick={scope.onLogin}>Login</Button>
        </Toolbar>
      </AppBar>

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