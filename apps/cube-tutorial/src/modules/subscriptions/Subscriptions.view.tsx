import React, { useCallback } from 'react'
import clsx from 'clsx'
import { Logger } from 'wdc-cube'
import { bindUpdate, IViewProps } from 'wdc-cube-react'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import { SubscriptionsScope } from './Subscriptions.presenter'
import Css from './Subscriptions.module.css'

const LOG = Logger.get('SubscriptionsView')

type SubscriptionsViewProps = IViewProps & { scope: SubscriptionsScope }

export function SubscriptionsView({ scope, className, ...props }: SubscriptionsViewProps) {
    bindUpdate(React, scope)

    LOG.debug('update')

    const itemArray = [] as JSX.Element[]

    for (const item of scope.sites) {
        const onItemClicked = useCallback(() => scope.onItemClicked(item), [item, scope.onItemClicked])

        itemArray.push(<ListItem key={item.id} button>
            <ListItemText primary={item.site} onClick={onItemClicked} />
        </ListItem>)
    }

    return (
        <div className={clsx(className, Css.SubscriptionView)} {...props}>
            <h1>Sites you can subscribe to...</h1>
            <List component="nav" aria-label="main mailbox folders">
                {itemArray}
            </List>
        </div>
    )
}
