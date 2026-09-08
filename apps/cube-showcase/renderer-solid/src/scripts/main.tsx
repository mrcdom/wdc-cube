// First, and deliberately: it decides how every scope in the application reports
// its changes, and it has to run before one exists.
import './instrumentation'

import { onCleanup } from 'solid-js'
import { render } from 'solid-js/web'
import { PageHistoryManager } from 'wdc-cube'
import { bindScope } from 'wdc-cube-solid'
import { startFakeApi } from 'wdc-cube-showcase-api'
import { initializeRoutes, registerServices } from 'wdc-cube-showcase-presentation'
import { MainPresenter } from 'wdc-cube-showcase-presentation/main'

import { MainView } from './modules/main'
import { registerAllViews } from './modules/ViewCatalog'

import './styles/index.scss'

function App() {
    const presenter = new MainPresenter(new PageHistoryManager(true))
    onCleanup(presenter.initialize())

    // Every other scope is bound by the slot that draws it; the root has no slot
    // above it, so it is bound here.
    return <MainView scope={bindScope(presenter.scope)} />
}

async function boot() {
    // Before the application: the first thing it does is ask who is signed in.
    // The worker script has to be served from this application's own origin, so
    // the path is this renderer's to give.
    await startFakeApi(`${import.meta.env.BASE_URL}mockServiceWorker.js`)

    registerServices()
    registerAllViews()
    initializeRoutes()

    const root = document.getElementById('root')
    if (root) {
        render(() => <App />, root)
    }
}

boot().catch((caught) => {
    document.body.textContent = `The showcase could not start: ${String(caught)}`
})
