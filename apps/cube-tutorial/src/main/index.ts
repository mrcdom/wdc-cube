import { ViewFactory } from 'wdc-cube-react'
import { ViewIds } from '../Constants'
import { BodyView } from './private_BodyView'
import { AlertView } from './private_AlertView'
export { MainView } from './Main.view'

export function registerMainViews() {
    const rv = ViewFactory.register
    rv(ViewIds.mainBody, BodyView)
    rv(ViewIds.mainAlert, AlertView)
}