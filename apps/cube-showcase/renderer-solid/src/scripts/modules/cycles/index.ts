import { ViewFactory } from 'wdc-cube-solid'
import { CyclesScope } from 'wdc-cube-showcase-presentation/cycles'

import { CyclesView } from './v-cycles'

export function registerViews(rv = ViewFactory.register) {
    rv(CyclesScope, CyclesView)
}
