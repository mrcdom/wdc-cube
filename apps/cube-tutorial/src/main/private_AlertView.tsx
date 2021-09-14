import React from 'react'
import clsx from 'clsx'
import Button from '@material-ui/core/Button'
import { Alert, AlertTitle } from '@material-ui/lab'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContentText from '@material-ui/core/DialogContentText'
import { bindUpdate } from 'wdc-cube-react'
import { AlertScope } from './Main.presenter'
import Css from './Main.module.css'

export type AlertViewProps = {
    scope: AlertScope
    className?: string
    style?: React.CSSProperties
}

export function AlertView({ scope, className, ...props }: AlertViewProps) {
    bindUpdate(React, scope)

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