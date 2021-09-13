import React from 'react'
import clsx from 'clsx'
import { bindUpdate, IViewProps } from 'wdc-cube-react'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import { SubscriptionsScope } from './Subscriptions.presenter'
import Css from './Subscriptions.module.css'

type SubscriptionsViewProps = { scope: SubscriptionsScope } & IViewProps<HTMLDivElement>

export function SubscriptionsView({ scope, className, ...props }: SubscriptionsViewProps) {
    bindUpdate(React, scope)

    const itemArray: JSX.Element[] = []

    for (const item of scope.sites) {
        itemArray.push(<ListItem key={item.id} button>
            <ListItemText primary={item.site} onClick={() => scope.onItemClicked(item)} />
        </ListItem>)
    }

    return (
        <div className={clsx(className, Css.SubscriptionView)} {...props}>
            <h1>Sites that you can subscribe to...</h1>
            <List component="nav" aria-label="main mailbox folders">
                {itemArray}
            </List>
        </div>
    )
}