import { ViewFactory } from 'wdc-cube-react'

import { registerViews as registerMainViews } from './main/view'
import { registerViews as registerTodoMvcViews } from './todo-mvc/view'
import { registerViews as registerSubscriptionsViews } from './subscriptions/view'
import { registerViews as registerRestrictedViews } from './restricted/view'

export function registerAllViews() {
    const rv = ViewFactory.register

    registerMainViews(rv)
    registerTodoMvcViews(rv)
    registerSubscriptionsViews(rv)
    registerRestrictedViews(rv)
}
