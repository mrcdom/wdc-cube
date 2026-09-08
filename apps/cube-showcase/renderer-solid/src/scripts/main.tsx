// First, and deliberately: it decides how every scope in the application reports
// its changes, and it has to run before one exists.
import './instrumentation'

import { onCleanup } from 'solid-js'
import { render } from 'solid-js/web'
import { PageHistoryManager } from 'wdc-cube'
import { bindScope } from 'wdc-cube-solid'
import { startFakeApi } from 'wdc-cube-showcase-api'
import { initializeRoutes, registerServices, ShowcaseService } from 'wdc-cube-showcase-presentation'
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
    // Where this application was deployed. At the root in development, under
    // the repository's name on GitHub Pages — and both sides of the boundary
    // need to know: the service so its calls land inside the deployment, the
    // worker so it answers them there.
    const base = import.meta.env.BASE_URL

    ShowcaseService.INSTANCE.baseUrl = `${base}api`

    // Before the application: the first thing it does is ask who is signed in.
    await startFakeApi(base)

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
