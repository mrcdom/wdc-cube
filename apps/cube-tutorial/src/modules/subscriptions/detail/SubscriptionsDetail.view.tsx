import React, { useCallback } from 'react'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import { Logger } from 'wdc-cube'
import { bindUpdate } from 'wdc-cube-react'
import { SubscriptionsDetailScope } from './SubscriptionsDetail.presenter'

const LOG = Logger.get('SubscriptionsDetailView')

export function SubscriptionsDetailView({ scope }: { scope: SubscriptionsDetailScope }) {
  bindUpdate(React, scope)

  LOG.debug('update')

  const onClose = useCallback(scope.onClose, [scope.onClose])
  const onSubscribe = useCallback(scope.onSubscribe, [scope.onSubscribe])
  const onEmailChanged = useCallback(event => { scope.onEmailChanged(event.target.value) }, [scope.onEmailChanged])

  return <>
    <DialogTitle>Subscribe</DialogTitle>
    <DialogContent>
      <DialogContentText>
        To subscribe to this website({scope.email}), please enter your email address here. We will send updates
        occasionally.
      </DialogContentText>
      <TextField
        autoFocus
        margin="dense"
        id="name"
        label="Email Address"
        type="email"
        fullWidth
        onChange={onEmailChanged}
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="primary">
        Cancel
      </Button>
      <Button onClick={onSubscribe} color="primary">
        Subscribe
      </Button>
    </DialogActions>
  </>
}
