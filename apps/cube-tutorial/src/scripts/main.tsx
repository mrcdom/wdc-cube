import React from 'react'
import { createRoot } from 'react-dom/client'
import { PageHistoryManager } from 'wdc-cube-react'

import './styles/index.css'

import { registerServices } from './services'
import { initialize as initializeRoutes } from './modules/Routes'
import { registerAllViews } from './modules/ViewCatalog'
import { MainPresenter } from './modules/main'
import { MainView } from './modules/main/view'

registerServices()
registerAllViews()
initializeRoutes()

const MainPresenterFactory = () => new MainPresenter(new PageHistoryManager(true))

function App() {
    const presenter = React.useMemo(MainPresenterFactory, [])

    React.useEffect(() => {
        const handleOnComponentWillUnmount = presenter.initialize()
        return () => {
            handleOnComponentWillUnmount()
        }
    }, [presenter])

    return <MainView scope={presenter.scope} />
}

const rootElm = document.getElementById('root')
if (rootElm) {
    const root = createRoot(rootElm)
    root.render(<App />)
}
