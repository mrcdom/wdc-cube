import React from 'react'
import clsx from 'clsx'
import { bindUpdate, ViewFactory, IViewProps } from 'wdc-cube-react'
import { TodoMvcScope } from './TodoMvcPresenter'
import Css from './TodoMvc.module.css'

type TodoMvcViewProps = { scope: TodoMvcScope } & IViewProps<HTMLDivElement>

export function TodoMvcView({ scope, className, ...otherProps }: TodoMvcViewProps) {
  bindUpdate(React, scope)

  const newField = React.useRef<HTMLInputElement>(null)

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
      {ViewFactory.createView(scope.main)}
      {ViewFactory.createView(scope.footer)}
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