import './styles/index.scss'

// Spectrum: the element that carries the design tokens, and the one system,
// colour and scale this app asks for. Each is a separate module so an
// application only pays for the combinations it uses.
import '@spectrum-web-components/theme/sp-theme.js'
import '@spectrum-web-components/theme/spectrum-two/theme-light.js'
import '@spectrum-web-components/theme/spectrum-two/scale-medium.js'

import { PageHistoryManager } from 'wdc-cube'
import { onActionError, ViewFactory } from 'wdc-cube-webc'
import { initializeRoutes, Places, registerServices } from 'wdc-cube-tutorial-presentation'
import { MainPresenter } from 'wdc-cube-tutorial-presentation/main'

import { registerAllViews } from './modules/ViewCatalog'

registerServices()
registerAllViews()
initializeRoutes()

onActionError((context, error) => {
    console.error(`[action] ${context}`, error)
})

async function start() {
    const presenter = new MainPresenter(new PageHistoryManager(true))

    // The shell is created once and never rebuilt: from here the presenter only
    // says what changed, and each element reads its own scope.
    const root = document.getElementById('root')
    const shell = ViewFactory.create(presenter.scope)
    if (!root || !shell) {
        throw new Error('No view registered for the application scope')
    }

    // Every Spectrum component reads its tokens from an sp-theme above it, so
    // the whole application lives inside one.
    const theme = document.createElement('sp-theme')
    theme.setAttribute('system', 'spectrum-two')
    theme.setAttribute('color', 'light')
    theme.setAttribute('scale', 'medium')
    theme.appendChild(shell)
    root.appendChild(theme)

    await presenter.kickStart(Places.main)
}

start().catch((caught) => console.error(caught))
