import React from 'react'
import clsx from 'clsx'
import { Logger } from 'wdc-cube'
import { bindUpdate, IViewProps, ViewSlot } from 'wdc-cube-react'
import { TodoMvcScope } from '../TodoMvc.scopes'
import Css from './TodoMvc.module.css'

import { HeaderView } from './HeaderView'
import { MainView } from './MainView'
import { FooterView } from './FooterView'

const LOG = Logger.get('TodoMvc.View')

type TodoMvcViewProps = IViewProps & { scope: TodoMvcScope }

export const TodoMvcView = function ({ className, style, scope }: TodoMvcViewProps) {
  LOG.debug('update')

  bindUpdate(React, scope)

  return <div className={clsx(className, Css.TodoMvcView)} style={style}>
    <div className={Css.body}>
      <h1>todos</h1>
      <div className={Css.todoapp}>
        <ViewSlot scope={scope.header} view={HeaderView} optional/>
        <ViewSlot scope={scope.main} view={MainView} optional />
        <ViewSlot scope={scope.footer} view={FooterView} optional />
      </div>
    </div>
  </div>
}
