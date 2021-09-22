import React from 'react'
import ReactDOM from 'react-dom'
import { ViewFactory } from 'wdc-cube-react'
import { MainView, BodyScope, BodyView } from './main'
import { TodoMvcScope, TodoMvcView } from './modules/todo-mvc'
import { SubscriptionsScope, SubscriptionsView, SubscriptionsDetailScope, SubscriptionsDetailView } from './modules/subscriptions'
import { RestrictedScope, RestrictedView } from './modules/restricted'
import './index.css'

function registerViews(rv = ViewFactory.register) {
    rv(BodyScope, BodyView)
    rv(TodoMvcScope, TodoMvcView)
    rv(SubscriptionsScope, SubscriptionsView)
    rv(SubscriptionsDetailScope, SubscriptionsDetailView)
    rv(RestrictedScope, RestrictedView)
}
registerViews()

ReactDOM.render(<MainView />, document.getElementById('root'))
