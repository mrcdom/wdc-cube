import React from 'react'
import { createRoot } from 'react-dom/client'
import { PageHistoryManager } from 'wdc-cube'

import './styles/index.scss'

import { initializeRoutes, registerServices } from 'wdc-cube-tutorial-presentation'
import { MainPresenter } from 'wdc-cube-tutorial-presentation/main'
import { registerAllViews } from './modules/ViewCatalog'
import { MainView } from './modules/main'

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
