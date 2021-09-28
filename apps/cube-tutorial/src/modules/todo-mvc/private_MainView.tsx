import React from 'react'
import clsx from 'clsx'
import { Logger } from 'wdc-cube'
import { bindUpdate, ViewSlot, IViewProps } from 'wdc-cube-react'
import Css from './TodoMvc.module.css'
import { MainScope } from './TodoMvc.presenter'
import { ItemView } from './private_ItemView'
import { ClockView } from './private_ClockView'

const LOG = Logger.get('TodoMvc.MainView')

type MainViewProps = IViewProps & { scope: MainScope }

export const MainView = function ({ className, style, scope }: MainViewProps) {
    LOG.debug('update')

    bindUpdate(React, scope)

    return <section className={clsx(className, Css.main)} style={style}>
        <ul className={Css['todo-list']}>
            <ViewSlot scope={scope.clock()} view={ClockView} />
            {scope.items.map(todo => <ViewSlot key={todo.id()} scope={todo} view={ItemView} />)}
        </ul>
    </section>
}