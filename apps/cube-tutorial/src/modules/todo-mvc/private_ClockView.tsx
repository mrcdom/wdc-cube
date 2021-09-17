import React from 'react'
import clsx from 'clsx'
import { Logger } from 'wdc-cube'
import { bindUpdate, IViewProps } from 'wdc-cube-react'
import { ClockScope } from './TodoMvc.presenter'
import Css from './TodoMvc.module.css'

const LOG = Logger.get('TodoMvc.ClockScope')

export function ClockView({ className, style, scope }: IViewProps & { scope: ClockScope }) {
    bindUpdate(React, scope)

    LOG.debug('update')

    return <li className={clsx(className, Css.clock)} style={style}>
        <div>{scope.date.toLocaleTimeString()}</div>
    </li>
}
