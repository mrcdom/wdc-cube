import React from 'react'
import clsx from 'clsx'
import { bindUpdate, IViewProps, ViewSlot } from 'wdc-cube-react'
import { TodoMvcScope } from './TodoMvc.presenter'
import Css from './TodoMvc.module.css'

export const TodoMvcView = function ({ className, style, scope }: IViewProps & { scope: TodoMvcScope }) {
  bindUpdate(React, scope)

  console.log('v-todos')

  return <div className={clsx(className, Css.TodoMvcView)} style={style}>
    <div className={Css.body}>
      <h1>todos</h1>
      <div className={Css.todoapp}>
        <ViewSlot scope={scope.header} />
        <ViewSlot scope={scope.main} />
        <ViewSlot scope={scope.footer} />
      </div>
    </div>
  </div>
}
