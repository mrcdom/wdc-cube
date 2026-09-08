import type { ViewFactory } from 'wdc-cube-webc'
import { RestrictedScope } from 'wdc-cube-tutorial-app/restricted'

import { RestrictedView } from './v-restricted'

export function registerViews(define: (typeof ViewFactory)['define']) {
    define('v-restricted', RestrictedScope, RestrictedView)
}
