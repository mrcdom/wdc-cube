import React from 'react'
import ReactDOM from 'react-dom'
import { registerMainViews, MainView } from './main'
import { registerTodoMvcViews } from './modules/todo-mvc'
import { registerSubscriptionsViews } from './modules/subscriptions'
import { registerRestrictedViews } from './modules/restricted'
import './index.css'

registerMainViews()
registerTodoMvcViews()
registerSubscriptionsViews()
registerRestrictedViews()

ReactDOM.render(<MainView />, document.getElementById('root'))
