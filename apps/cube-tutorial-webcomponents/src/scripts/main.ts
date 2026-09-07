import './styles/index.scss'

import { PageHistoryManager } from 'wdc-cube'
import { onActionError, ViewFactory } from 'wdc-cube-webcomponents'
import { initializeRoutes, Places, registerServices } from 'wdc-cube-tutorial-core'
import { MainPresenter } from 'wdc-cube-tutorial-core/main'

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
    root.appendChild(shell)

    await presenter.kickStart(Places.main)
}

start().catch((caught) => console.error(caught))
