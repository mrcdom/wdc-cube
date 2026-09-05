import React from 'react'
import clsx from 'clsx'
import { Logger } from 'wdc-cube'
import { classToFComponent, type FCClassContext, type IViewProps } from 'wdc-cube-react'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import { SubscriptionsScope } from '../subscriptions.scope'
import Css from './subscriptions.module.scss'

const LOG = Logger.get('SubscriptionsView')

type SubscriptionsViewProps = IViewProps & { scope: SubscriptionsScope }

class SubscriptionsViewClass implements FCClassContext<SubscriptionsViewProps> {
    scope!: SubscriptionsScope

    render({ className, ...props }: SubscriptionsViewProps) {
        LOG.debug('update')

        const itemArray = [] as React.JSX.Element[]

        for (const item of this.scope.sites) {
            itemArray.push(
                <ListItem key={item.id} disablePadding>
                    <ListItemButton onClick={() => this.scope.onItemClicked(item)}>
                        <ListItemText primary={item.site} />
                    </ListItemButton>
                </ListItem>
            )
        }

        return (
            <div className={clsx(className, Css.subscriptionsView)} {...props}>
                <h1>Sites you can subscribe to...</h1>
                <List component="nav" aria-label="main mailbox folders">
                    {itemArray}
                </List>
            </div>
        )
    }
}

export const SubscriptionsView = classToFComponent<SubscriptionsViewProps>(SubscriptionsViewClass)
