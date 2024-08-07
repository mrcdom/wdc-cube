import React from 'react'
import { createRoot } from 'react-dom/client'
import { PageHistoryManager } from 'wdc-cube-react'
import { registerServices } from './services'
import { MainPresenter } from './main'
import { registerViews as registerMainViews, MainView } from './main/views'
import { registerViews as registerTodoMvcViews } from './modules/todo-mvc/views'
import { registerViews as registerSubscriptionsViews } from './modules/subscriptions/views'
import { registerViews as registerRestrictedViews } from './modules/restricted/views'
import { buildCube } from './Cube'
import './index.css'

registerServices()
registerMainViews()
registerTodoMvcViews()
registerSubscriptionsViews()
registerRestrictedViews()
buildCube()

const historyManager = new PageHistoryManager(true)

function App() {
    const presenter = React.useMemo(() => new MainPresenter(historyManager), [])

    React.useEffect(() => {
        const handleOnComponentWillUnmount = presenter.initialize()
        return () => {
            handleOnComponentWillUnmount()
        }
    }, [presenter])

    return <MainView scope={presenter.scope} />
}

const container = document.getElementById('root')
if (container) {
    const root = createRoot(container)
    root.render(<App />)
}
