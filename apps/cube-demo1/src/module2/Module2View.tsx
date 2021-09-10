import React, { HTMLAttributes } from 'react'
import clsx from 'clsx'
import { bindUpdate } from 'wdc-cube-react'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import { Module2Scope } from './Module2Presenter'
import Css from './Module2View.module.css'

type Module2ViewProps = { scope: Module2Scope } & HTMLAttributes<HTMLDivElement>

export function Module2View({ className, style, scope }: Module2ViewProps) {
    bindUpdate(React, scope)

    const itemArray: JSX.Element[] = []

    for (const item of scope.sites) {
        itemArray.push(<ListItem key={item.id} button>
            <ListItemText primary={item.site} onClick={() => scope.onItemClicked(item)} />
        </ListItem>)
    }

    

    return (
        <div className={clsx(className, Css.View)} style={style}>
            <h1>Sites that you can subscribe to...</h1>
            <List component="nav" aria-label="main mailbox folders">
                {itemArray}
            </List>
        </div>
    )
}