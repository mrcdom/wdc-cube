import React from 'react'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { Logger } from 'wdc-cube'
import { classToFComponent, FCClass } from 'wdc-cube-react'
import { SubscriptionsDetailScope } from 'wdc-cube-tutorial-presentation/subscriptions'

const LOG = Logger.get('SubscriptionsDetailView')

type SubscriptionsDetailViewProps = { scope: SubscriptionsDetailScope }

class SubscriptionsDetailViewClass extends FCClass<SubscriptionsDetailViewProps> {
    private readonly onClose = () => this.scope.onClose()
    private readonly onSubscribe = () => this.scope.onSubscribe()
    private readonly onEmailChanged = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        this.scope.onEmailChanged(event.target.value)
    }

    render() {
        LOG.debug('update')

        return (
            <>
                <DialogTitle>Subscribe</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        To subscribe to this website({this.scope.site}), please enter your email address here. We will
                        send updates occasionally.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="name"
                        label="Email Address"
                        type="email"
                        fullWidth
                        onChange={this.onEmailChanged}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.onClose} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={this.onSubscribe} color="primary">
                        Subscribe
                    </Button>
                </DialogActions>
            </>
        )
    }
}

export const SubscriptionsDetailView = classToFComponent(SubscriptionsDetailViewClass)
