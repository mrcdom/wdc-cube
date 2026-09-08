// First, and deliberately: it decides how every scope in the application
// reports its changes, and it has to run before one exists.
import './instrumentation'

import { onCleanup } from 'solid-js'
import { render } from 'solid-js/web'
import { PageHistoryManager } from 'wdc-cube'
import { bindScope } from 'wdc-cube-solid'
import { initializeRoutes, registerServices } from 'wdc-cube-tutorial-presentation'
import { MainPresenter } from 'wdc-cube-tutorial-presentation/main'

import { MainView } from './modules/main'
import { registerAllViews } from './modules/ViewCatalog'

import './styles/index.scss'

registerServices()
registerAllViews()
initializeRoutes()

function App() {
    const presenter = new MainPresenter(new PageHistoryManager(true))
    onCleanup(presenter.initialize())

    // Every other scope is bound by the slot that draws it; the root has no
    // slot above it, so it is bound here.
    return <MainView scope={bindScope(presenter.scope)} />
}

const root = document.getElementById('root')
if (root) {
    render(() => <App />, root)
}
