import { ViewFactory } from 'wdc-cube-solid'

import { registerViews as registerMainViews } from './main'
import { registerViews as registerRestrictedViews } from './restricted'
import { registerViews as registerSubscriptionsViews } from './subscriptions'
import { registerViews as registerTodoMvcViews } from './todo-mvc'

export function registerAllViews() {
    const rv = ViewFactory.register

    registerMainViews(rv)
    registerTodoMvcViews(rv)
    registerSubscriptionsViews(rv)
    registerRestrictedViews(rv)
}
