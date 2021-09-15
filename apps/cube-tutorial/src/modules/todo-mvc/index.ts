import { ViewFactory } from 'wdc-cube-react'
import { ViewIds } from '../../Constants'
import { TodoMvcView } from './TodoMvc.view'
import { HeaderView } from './private_HeaderView'
import { MainView } from './private_MainView'
import { ItemView } from './private_ItemView'
import { FooterView } from './private_FooterView'

export function registerTodoMvcViews() {
    const rv = ViewFactory.register

    rv(ViewIds.todos, TodoMvcView)
    rv(ViewIds.todosHeader, HeaderView)
    rv(ViewIds.todosMain, MainView)
    rv(ViewIds.todosItem, ItemView)
    rv(ViewIds.todosFooter, FooterView)
}