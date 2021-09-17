import React from 'react'
import clsx from 'clsx'
import { Logger } from 'wdc-cube'
import { bindUpdate, ViewSlot, IViewProps } from 'wdc-cube-react'
import Css from './TodoMvc.module.css'
import { MainScope } from './TodoMvc.presenter'

const LOG = Logger.get('TodoMvc.MainView')

type MainViewProps = IViewProps & { scope: MainScope }

export const MainView = function ({ className, style, scope }: MainViewProps) {
    LOG.debug('update')

    bindUpdate(React, scope)

    return <section className={clsx(className, Css.main)} style={style}>
        <ul className={Css['todo-list']}>
            <ViewSlot scope={scope.clock} />
            {scope.items.map(todo => <ViewSlot key={todo.id} scope={todo} />)}
        </ul>
    </section>
}