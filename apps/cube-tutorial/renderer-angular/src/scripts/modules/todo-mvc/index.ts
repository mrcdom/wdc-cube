import type { ViewFactory } from 'wdc-cube-angular'
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
import { TodoMainView } from './v-main'
import { TodoMvcView } from './v-todo-mvc'

export function registerViews(rv: (typeof ViewFactory)['register']) {
    rv(TodoMvcScope, TodoMvcView)
    rv(HeaderScope, HeaderView)
    rv(MainScope, TodoMainView)
    rv(FooterScope, FooterView)
    rv(ItemScope, ItemView)
    rv(ClockScope, ClockView)
}
