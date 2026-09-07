import { ViewFactory } from 'wdc-cube-webcomponents'

import { registerViews as registerMain } from './main'
import { registerViews as registerRestricted } from './restricted'
import { registerViews as registerSubscriptions } from './subscriptions'
import { registerViews as registerTodoMvc } from './todo-mvc'

/** Every scope→tag pair, in one place. */
export function registerAllViews() {
    const define = ViewFactory.define
    registerMain(define)
    registerTodoMvc(define)
    registerSubscriptions(define)
    registerRestricted(define)
}
