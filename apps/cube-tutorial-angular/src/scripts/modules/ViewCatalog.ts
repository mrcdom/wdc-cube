import { ViewFactory } from 'wdc-cube-angular'

import { registerViews as registerMainViews } from './main'
import { registerViews as registerTodoMvcViews } from './todo-mvc'
import { registerViews as registerSubscriptionsViews } from './subscriptions'
import { registerViews as registerRestrictedViews } from './restricted'

export function registerAllViews() {
    const rv = ViewFactory.register

    registerMainViews(rv)
    registerTodoMvcViews(rv)
    registerSubscriptionsViews(rv)
    registerRestrictedViews(rv)
}
