import { ViewFactory } from 'wdc-cube-solid'
import { DashboardScope } from 'wdc-cube-showcase-presentation/dashboard'

import { DashboardView } from './v-dashboard'

export function registerViews(rv = ViewFactory.register) {
    rv(DashboardScope, DashboardView)
}
