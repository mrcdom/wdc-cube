import { ViewFactory } from 'wdc-cube-react'
import { MainView } from './v-main'
import { BodyView } from './v-body'
import { MainScope, BodyScope } from 'wdc-cube-tutorial-app/main'

export { MainView } from './v-main'

export function registerViews(rv = ViewFactory.register) {
    rv(MainScope, MainView)
    rv(BodyScope, BodyView)
}
