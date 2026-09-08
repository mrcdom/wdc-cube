import { ViewFactory } from 'wdc-cube-solid'
import {
    ClockScope,
    FooterScope,
    HeaderScope,
    ItemScope,
    MainScope,
    TodoMvcScope
} from 'wdc-cube-tutorial-presentation/todo-mvc'

import { ClockView } from './v-clock'
import { FooterView } from './v-footer'
import { HeaderView } from './v-header'
import { ItemView } from './v-item'
import { MainView } from './v-main'
import { TodoMvcView } from './v-todo-mvc'

export function registerViews(rv = ViewFactory.register) {
    rv(TodoMvcScope, TodoMvcView)
    rv(HeaderScope, HeaderView)
    rv(MainScope, MainView)
    rv(ItemScope, ItemView)
    rv(FooterScope, FooterView)
    rv(ClockScope, ClockView)
}
