import { ViewFactory } from 'wdc-cube-react'
import { TodoMvcScope } from 'wdc-cube-tutorial-app/todo-mvc'
import { TodoMvcView } from './v-todo-mvc'

export function registerViews(rv = ViewFactory.register) {
    rv(TodoMvcScope, TodoMvcView)
}
