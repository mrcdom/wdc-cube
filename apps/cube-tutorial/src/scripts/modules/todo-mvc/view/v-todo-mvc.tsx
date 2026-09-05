import React from 'react'
import clsx from 'clsx'
import { Logger } from 'wdc-cube'
import { bindUpdate, IViewProps, ViewSlot } from 'wdc-cube-react'
import { TodoMvcScope } from '../todo-mvc.scope'
import Css from './todo-mvc.module.css'

import { HeaderView } from './v-header'
import { MainView } from './v-main'
import { FooterView } from './v-footer'

const LOG = Logger.get('TodoMvc.View')

type TodoMvcViewProps = IViewProps & { scope: TodoMvcScope }

export const TodoMvcView = function ({ className, style, scope }: TodoMvcViewProps) {
    LOG.debug('update')

    bindUpdate(React, scope)

    return (
        <div className={clsx(className, Css.TodoMvcView)} style={style}>
            <div className={Css.body}>
                <h1>todos</h1>
                <div className={Css.todoapp}>
                    <ViewSlot scope={scope.header} view={HeaderView} optional />
                    <ViewSlot scope={scope.main} view={MainView} optional />
                    <ViewSlot scope={scope.footer} view={FooterView} optional />
                </div>
            </div>
        </div>
    )
}
