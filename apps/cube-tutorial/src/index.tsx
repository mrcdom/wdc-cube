import React from 'react'
import ReactDOM from 'react-dom'
import { registerMainViews as registerMainViews, MainView } from './main/views'
import { registerTodoMvcViews as registerTodoMvcViews } from './modules/todo-mvc/views'
import { registerViews as registerSubscriptionsViews } from './modules/subscriptions/views'
import { registerViews as registerRestrictedViews } from './modules/restricted/views'
import './index.css'

registerMainViews()
registerTodoMvcViews()
registerSubscriptionsViews()
registerRestrictedViews()

ReactDOM.render(<MainView />, document.getElementById('root'))