import React from 'react'
import ReactDOM from 'react-dom'
import { stopServices } from './services'
import { registerMainViews, MainView } from './main'
import { registerTodoMvcViews } from './modules/todo-mvc'
import { registerSubscriptionsViews } from './modules/subscriptions'
import { registerRestrictedViews } from './modules/restricted'
import './index.css'

window.addEventListener('beforeunload', async () => {
    await stopServices()
}, { passive: false })

registerMainViews()
registerTodoMvcViews()
registerSubscriptionsViews()
registerRestrictedViews()

ReactDOM.render(<MainView />, document.getElementById('root'))
