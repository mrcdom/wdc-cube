import React from 'react'
import clsx from 'clsx'
import { Logger } from 'wdc-cube'
import { bindUpdate, IViewProps, ViewSlot } from 'wdc-cube-react'
import { TodoMvcScope } from './TodoMvc.presenter'
import Css from './TodoMvc.module.css'

import { HeaderView } from './private_HeaderView'
import { MainView } from './private_MainView'
import { FooterView } from './private_FooterView'

const LOG = Logger.get('TodoMvc.View')

type TodoMvcViewProps = IViewProps & { scope: TodoMvcScope }

export const TodoMvcView = function ({ className, style, scope }: TodoMvcViewProps) {
  LOG.debug('update')

  bindUpdate(React, scope)

  return <div className={clsx(className, Css.TodoMvcView)} style={style}>
    <div className={Css.body}>
      <h1>todos</h1>
      <div className={Css.todoapp}>
        <ViewSlot scope={scope.header()} view={HeaderView} />
        <ViewSlot scope={scope.main()} view={MainView} />
        <ViewSlot scope={scope.footer()} view={FooterView} />
      </div>
    </div>
  </div>
}
