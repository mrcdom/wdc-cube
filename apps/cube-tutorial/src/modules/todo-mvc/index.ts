import { ViewFactory } from 'wdc-cube-react'
import { TodoMvcScope, HeaderScope, MainScope, ItemScope, FooterScope, ClockScope } from './TodoMvc.presenter'

import { TodoMvcView } from './TodoMvc.view'
import { HeaderView } from './private_HeaderView'
import { MainView } from './private_MainView'
import { ItemView } from './private_ItemView'
import { FooterView } from './private_FooterView'
import { ClockView } from './private_ClockView'

export function registerTodoMvcViews() {
    const rv = ViewFactory.register

    rv(TodoMvcScope, TodoMvcView)
    rv(HeaderScope, HeaderView)
    rv(MainScope, MainView)
    rv(ItemScope, ItemView)
    rv(FooterScope, FooterView)
    rv(ClockScope, ClockView)
}