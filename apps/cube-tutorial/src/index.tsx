import React from 'react'
import ReactDOM from 'react-dom'
import { PageHistoryManager } from 'wdc-cube-react'
import { MainPresenter } from './main'
import { registerViews as registerMainViews, MainView } from './main/views'
import { registerViews as registerTodoMvcViews } from './modules/todo-mvc/views'
import { registerViews as registerSubscriptionsViews } from './modules/subscriptions/views'
import { registerViews as registerRestrictedViews } from './modules/restricted/views'
import './index.css'

registerMainViews()
registerTodoMvcViews()
registerSubscriptionsViews()
registerRestrictedViews()

const historyManager = new PageHistoryManager(true)
const mainPresenterFactory = () => new MainPresenter(historyManager)

ReactDOM.render(<MainView presenterFactory={mainPresenterFactory} />, document.getElementById('root'))