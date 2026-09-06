import { ViewFactory } from 'wdc-cube-react'
import { TodoMvcScope } from 'wdc-cube-tutorial-core/todo-mvc'
import { TodoMvcView } from './v-todo-mvc'

export function registerViews(rv = ViewFactory.register) {
    rv(TodoMvcScope, TodoMvcView)
}
