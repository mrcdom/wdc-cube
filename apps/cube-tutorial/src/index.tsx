import React from 'react'
import ReactDOM from 'react-dom'
import { buildCube } from './Cube'
import { registerMainViews, MainView } from './main'
import { registerTodoMvcViews } from './modules/todo-mvc'
import { registerSubscriptionsViews } from './modules/subscriptions'
import { registerRestrictedViews } from './modules/restricted'
import './index.css'

registerMainViews()
registerTodoMvcViews()
registerSubscriptionsViews()
registerRestrictedViews()

buildCube()

ReactDOM.render(<MainView />, document.getElementById('root'))
