import { ViewFactory } from 'wdc-cube-react'
import { MainView } from './Main.view'
import { BodyView } from './BodyView'
import { MainScope, BodyScope } from '../Main.scopes'

export { MainView } from './Main.view'

export function registerMainViews(rv = ViewFactory.register) {
    rv(MainScope, MainView)
    rv(BodyScope, BodyView)
}