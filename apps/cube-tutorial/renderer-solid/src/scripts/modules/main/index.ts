import { ViewFactory } from 'wdc-cube-solid'
import { AlertScope, BodyScope, MainScope } from 'wdc-cube-tutorial-presentation/main'

import { AlertView } from './v-alert'
import { BodyView } from './v-body'
import { MainView } from './v-main'

export { MainView } from './v-main'

export function registerViews(rv = ViewFactory.register) {
    rv(MainScope, MainView)
    rv(BodyScope, BodyView)
    rv(AlertScope, AlertView)
}
