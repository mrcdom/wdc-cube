import clsx from 'clsx'

import { Logger } from 'wdc-cube'
import { classToFComponent, FCClass, ViewSlot } from 'wdc-cube-react'

import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import AppBar from '@mui/material/AppBar'
import Dialog from '@mui/material/Dialog'
import Button from '@mui/material/Button'
import MenuIcon from '@mui/icons-material/Menu'

import Css from './main.module.scss'
import { MainScope } from 'wdc-cube-tutorial-core/main'
import { AlertView } from './v-alert'

const LOG = Logger.get('MainView')

export type MainViewProps = {
    className?: string
    scope: MainScope
}

class MainViewClass extends FCClass<MainViewProps> {
    private readonly onHome = () => this.scope.onHome()
    private readonly onOpenTodos = () => this.scope.onOpenTodos()
    private readonly onOpenSuscriptions = () => this.scope.onOpenSuscriptions()
    private readonly onLogin = () => this.scope.onLogin()
    private readonly onCloseDialog = () => this.scope.dialog?.onClose()
    private readonly onCloseAlert = () => this.scope.alert?.onClose()

    render({ className }: MainViewProps) {
        LOG.debug('update')

        const scope = this.scope

        return (
            <div className={clsx(className, Css.mainView)}>
                <AppBar position="static">
                    <Toolbar>
                        <IconButton edge="start" className={Css.appBarMenuButton} color="inherit" aria-label="menu">
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" className={Css.appBarTitle}>
                            Cube Framework (Tutorial Example)
                        </Typography>
                        <Button color="inherit" onClick={this.onHome}>
                            Home
                        </Button>
                        <Button color="inherit" onClick={this.onOpenTodos}>
                            Todos
                        </Button>
                        <Button color="inherit" onClick={this.onOpenSuscriptions}>
                            Subscriptions
                        </Button>
                        <Button color="inherit" onClick={this.onLogin}>
                            Login
                        </Button>
                    </Toolbar>
                </AppBar>

                <ViewSlot className={Css.body} scope={scope.body} optional={false} />

                <Dialog open={!!scope.dialog} onClose={this.onCloseDialog} aria-labelledby="form-dialog-title">
                    <ViewSlot scope={scope.dialog} />
                </Dialog>

                <Dialog open={!!scope.alert} onClose={this.onCloseAlert} aria-labelledby="form-dialog-title">
                    <ViewSlot scope={scope.alert} view={AlertView} />
                </Dialog>
            </div>
        )
    }
}

export const MainView = classToFComponent(MainViewClass)
