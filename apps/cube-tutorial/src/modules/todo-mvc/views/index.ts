import { ViewFactory } from 'wdc-cube-react'
import { TodoMvcScope } from '../TodoMvc.scopes'
import { TodoMvcView } from './TodoMvc.view'

export function registerViews(rv = ViewFactory.register) {
    rv(TodoMvcScope, TodoMvcView)
}