import React from 'react'
import clsx from 'clsx'
import { Logger } from 'wdc-cube'
import { bindUpdate, ViewSlot, IViewProps } from 'wdc-cube-react'
import Css from './TodoMvc.module.css'
import { MainScope } from './TodoMvc.presenter'

const LOG = Logger.get('TodoMvc.MainView')

export const MainView = function ({ className, style, scope }: IViewProps & { scope: MainScope }) {
    bindUpdate(React, scope)

    LOG.debug('update')

    return <section className={clsx(className, Css.main)} style={style}>
        <ul className={Css['todo-list']}>
            {scope.items.map(todo => <ViewSlot key={todo.id} scope={todo} />)}
        </ul>
    </section>
}