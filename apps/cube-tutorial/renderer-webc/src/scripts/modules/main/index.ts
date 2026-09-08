import type { ViewFactory } from 'wdc-cube-webc'
import { AlertScope, BodyScope, MainScope } from 'wdc-cube-tutorial-presentation/main'

import { AlertView } from './v-alert'
import { BodyView } from './v-body'
import { MainView } from './v-main'

export function registerViews(define: (typeof ViewFactory)['define']) {
    define('v-main', MainScope, MainView)
    define('v-body', BodyScope, BodyView)
    define('v-alert', AlertScope, AlertView)
}
