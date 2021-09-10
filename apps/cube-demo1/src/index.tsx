import React from 'react'
import ReactDOM from 'react-dom'
import { stopServices } from './services'
import { ViewFactory } from 'wdc-cube-react'
import { ViewIds } from './Constants'
import { AlertView } from './main/AlertView'
import { MainView } from './main/MainView'
import { MainBodyView } from './main/MainBodyView'
import { Module1View } from './module1/Module1View'
import { Module1DetailView } from './module1/Module1DetailView'
import { Module2View } from './module2/Module2View'
import { Module2DetailView } from './module2/Module2DetailView'
import './index.css'

window.addEventListener('beforeunload', async () => {
    await stopServices()
}, {passive: false})

{ // View Registration
    const register = ViewFactory.register

    register(ViewIds.alert, AlertView)
    register(ViewIds.mainBody, MainBodyView)
    register(ViewIds.module1, Module1View)
    register(ViewIds.module1Detail, Module1DetailView)
    register(ViewIds.module2, Module2View)
    register(ViewIds.module2Detail, Module2DetailView)
}

ReactDOM.render(<MainView />, document.getElementById('root'))
