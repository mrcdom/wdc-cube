import React from 'react'
import clsx from 'clsx'
import { bindUpdate, ViewFactory } from 'wdc-cube-react'
import type { HTMLDivProps } from './types'
import { TodoMvcScope } from './TodoMvcPresenter'
import Css from './TodoMvc.module.css'

type Module1ViewProps = HTMLDivProps & { scope: TodoMvcScope }

export function TodoMvcView({ className, scope, ...otherProps }: Module1ViewProps) {
  bindUpdate(React, scope)

  const newField = React.useRef<HTMLInputElement>(null)

  const mainView = ViewFactory.createView(scope.main)
  const footerView = ViewFactory.createView(scope.footer)

  return <div className={clsx(className, Css.TodoMvcView)} {...otherProps}>
    <div className={Css.todoapp}>
      <header className={Css['header']}>
        <h1>todos</h1>
        <input
          ref={newField}
          className={Css['new-todo']}
          placeholder="What needs to be done?"
          onKeyDown={e => handleNewTodoKeyDown(scope, e, newField)}
          autoFocus={true}
        />
      </header>
      {mainView}
      {footerView}
    </div>
  </div>
}

function handleNewTodoKeyDown(scope: TodoMvcScope, event: React.KeyboardEvent<HTMLInputElement>, newField: React.RefObject<HTMLInputElement>) {
  if (event.code !== 'Enter') {
    return
  }

  event.preventDefault()

  if (newField.current) {
    const val = newField.current.value.trim()

    if (val) {
      scope.onAddTodo(val)
      newField.current.value = ''
    }
  }
}