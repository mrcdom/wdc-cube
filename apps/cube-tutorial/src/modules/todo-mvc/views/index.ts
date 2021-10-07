import { ViewFactory } from 'wdc-cube-react'
import { TodoMvcScope } from '../TodoMvc.scopes'
import { TodoMvcView } from './TodoMvc.view'

export function registerTodoMvcViews(rv = ViewFactory.register) {
    rv(TodoMvcScope, TodoMvcView)
}