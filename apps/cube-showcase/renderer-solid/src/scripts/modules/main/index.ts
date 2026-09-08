import { ViewFactory } from 'wdc-cube-solid'
import { AlertScope, MainScope } from 'wdc-cube-showcase-presentation/main'

import { AlertView } from './v-alert'
import { MainView } from './v-main'

export { MainView } from './v-main'

export function registerViews(rv = ViewFactory.register) {
    rv(MainScope, MainView)
    rv(AlertScope, AlertView)
}
