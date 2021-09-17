import { ViewFactory } from 'wdc-cube-react'
import { AlertScope, BodyScope } from './Main.presenter'
import { BodyView } from './private_BodyView'
import { AlertView } from './private_AlertView'
export { MainView } from './Main.view'

export function registerMainViews() {
    const rv = ViewFactory.register
    rv(BodyScope, BodyView)
    rv(AlertScope, AlertView)
}