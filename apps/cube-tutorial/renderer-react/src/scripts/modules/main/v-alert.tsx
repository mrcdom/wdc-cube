import clsx from 'clsx'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'
import { Logger } from 'wdc-cube'
import { classToFComponent, FCClass, type IViewProps } from 'wdc-cube-react'
import { AlertScope } from 'wdc-cube-tutorial-presentation/main'
import Css from './main.module.scss'

const LOG = Logger.get('Main.AlertView')

export type AlertViewProps = IViewProps & {
    scope: AlertScope
}

class AlertViewClass extends FCClass<AlertViewProps> {
    // Instance methods are stable by construction: no useCallback needed
    private readonly onClose = () => this.scope.onClose()

    render({ className, ...props }: AlertViewProps) {
        LOG.debug('update')

        const scope = this.scope

        return (
            <>
                <Alert className={clsx(className, Css.alertPane)} severity={scope.severity} {...props}>
                    <AlertTitle>{scope.title}</AlertTitle>
                    <DialogContentText>{scope.message}</DialogContentText>
                </Alert>
                <DialogActions>
                    <Button onClick={this.onClose} color="primary">
                        Close
                    </Button>
                </DialogActions>
            </>
        )
    }
}

export const AlertView = classToFComponent(AlertViewClass)
