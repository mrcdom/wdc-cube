import React from 'react'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import { bindUpdate } from 'wdc-cube-react'
import { SubscriptionsDetailScope } from './SubscriptionsDetail.presenter'

export function SubscriptionsDetailView({ scope }: { scope: SubscriptionsDetailScope }) {
  bindUpdate(React, scope)

  return <>
    <DialogTitle>Subscribe</DialogTitle>
    <DialogContent>
      <DialogContentText>
        To subscribe to this website({scope.name}), please enter your email address here. We will send updates
        occasionally.
      </DialogContentText>
      <TextField
        autoFocus
        margin="dense"
        id="name"
        label="Email Address"
        type="email"
        fullWidth
        onChange={event => {scope.onEmailChanged(event.target.value)}}
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={scope.onClose} color="primary">
        Cancel
      </Button>
      <Button onClick={scope.onSubscribe} color="primary">
        Subscribe
      </Button>
    </DialogActions>
  </>
}