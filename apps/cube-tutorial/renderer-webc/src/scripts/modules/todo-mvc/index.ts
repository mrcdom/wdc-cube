import type { ViewFactory } from 'wdc-cube-webc'
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

export function registerViews(define: (typeof ViewFactory)['define']) {
    define('v-todo-mvc', TodoMvcScope, TodoMvcView)
    define('v-todo-header', HeaderScope, HeaderView)
    define('v-todo-main', MainScope, TodoMainView)
    define('v-todo-footer', FooterScope, FooterView)
    define('v-todo-item', ItemScope, ItemView)
    define('v-todo-clock', ClockScope, ClockView)
}
