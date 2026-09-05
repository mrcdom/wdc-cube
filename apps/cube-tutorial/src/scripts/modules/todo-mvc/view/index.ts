import { ViewFactory } from 'wdc-cube-react'
import { TodoMvcScope } from '../todo-mvc.scope'
import { TodoMvcView } from './v-todo-mvc'

export function registerViews(rv = ViewFactory.register) {
    rv(TodoMvcScope, TodoMvcView)
}
