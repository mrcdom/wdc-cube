import { ViewFactory } from 'wdc-cube-react'
import { ViewIds } from '../../Constants'
import { TodoMvcView } from './TodoMvcView'
import { MainView } from './private_MainView'
import { ItemView } from './private_ItemView'
import { FooterView } from './private_FooterView'

export function registerModule1Views() {
    const rv = ViewFactory.register

    rv(ViewIds.module1, TodoMvcView)
    rv(ViewIds.todoMain, MainView)
    rv(ViewIds.todoItem, ItemView)
    rv(ViewIds.todoFooter, FooterView)
}