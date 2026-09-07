import type { ViewFactory } from 'wdc-cube-angular'
import { RestrictedScope } from 'wdc-cube-tutorial-core/restricted'

import { RestrictedView } from './v-restricted'

export function registerViews(rv: (typeof ViewFactory)['register']) {
    rv(RestrictedScope, RestrictedView)
}
