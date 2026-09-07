import type { ViewFactory } from 'wdc-cube-angular'
import { AlertScope, BodyScope, MainScope } from 'wdc-cube-tutorial-core/main'

import { AlertView } from './v-alert'
import { BodyView } from './v-body'
import { MainView } from './v-main'

export { MainView }

export function registerViews(rv: (typeof ViewFactory)['register']) {
    rv(MainScope, MainView)
    rv(BodyScope, BodyView)
    rv(AlertScope, AlertView)
}
