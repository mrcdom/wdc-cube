import React from 'react'
import Button from '@material-ui/core/Button'
import { Alert, AlertTitle } from '@material-ui/lab'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContentText from '@material-ui/core/DialogContentText'
import { bindUpdate } from 'wdc-cube-react'
import { AlertScope } from './MainPresenter'

const Style = {
    alertPane: {
        marginTop: 20,
        marginLeft: 20,
        marginRight: 20
    }
}

export function AlertView({ scope }: { scope: AlertScope }) {
    bindUpdate(React, scope)

    return <>
        <Alert severity={scope.severity} style={Style.alertPane}>
            <AlertTitle>{scope.title}</AlertTitle>
            <DialogContentText>{scope.message}</DialogContentText>
        </Alert>
        <DialogActions>
            <Button onClick={scope.onClose} color="primary">Close</Button>
        </DialogActions>
    </>
}