import React, { useCallback } from 'react'
import clsx from 'clsx'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'
import { Logger } from 'wdc-cube'
import { bindUpdate, IViewProps } from 'wdc-cube-react'
import { AlertScope } from '../Main.scopes'
import Css from './Main.module.css'

const LOG = Logger.get('Main.AlertView')

export type AlertViewProps = IViewProps & {
    scope: AlertScope
}

export function AlertView({ scope, className, ...props }: AlertViewProps) {
    bindUpdate(React, scope)

    LOG.debug('update')

    const onClose = useCallback(scope.onClose, [scope.onClose])

    return <>
        <Alert className={clsx(className, Css.AlertPane)} severity={scope.severity} {...props}>
            <AlertTitle>{scope.title}</AlertTitle>
            <DialogContentText>{scope.message}</DialogContentText>
        </Alert>
        <DialogActions>
            <Button onClick={onClose} color="primary">Close</Button>
        </DialogActions>
    </>
}
