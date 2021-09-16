import React from 'react'
import clsx from 'clsx'
import Button from '@material-ui/core/Button'
import { Alert, AlertTitle } from '@material-ui/lab'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContentText from '@material-ui/core/DialogContentText'
import { Logger } from 'wdc-cube'
import { bindUpdate, IViewProps } from 'wdc-cube-react'
import { AlertScope } from './Main.presenter'
import Css from './Main.module.css'

const LOG = Logger.get('Main.AlertView')

export type AlertViewProps = IViewProps & {
    scope: AlertScope
}

export function AlertView({ scope, className, ...props }: AlertViewProps) {
    bindUpdate(React, scope)

    LOG.debug('update')

    return <>
        <Alert className={clsx(className, Css.AlertPane)} severity={scope.severity} {...props}>
            <AlertTitle>{scope.title}</AlertTitle>
            <DialogContentText>{scope.message}</DialogContentText>
        </Alert>
        <DialogActions>
            <Button onClick={scope.onClose} color="primary">Close</Button>
        </DialogActions>
    </>
}