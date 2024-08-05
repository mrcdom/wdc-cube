import React, { useCallback } from 'react'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { Logger } from 'wdc-cube'
import { bindUpdate } from 'wdc-cube-react'
import { SubscriptionsDetailScope } from '../SubscriptionsDetail.scopes'

const LOG = Logger.get('SubscriptionsDetailView')

export function SubscriptionsDetailView({ scope }: { scope: SubscriptionsDetailScope }) {
  bindUpdate(React, scope)

  LOG.debug('update')

  const onClose = useCallback(scope.onClose, [scope.onClose])
  const onSubscribe = useCallback(scope.onSubscribe, [scope.onSubscribe])
  const onEmailChanged = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { scope.onEmailChanged(event.target.value) }, [scope.onEmailChanged])

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
