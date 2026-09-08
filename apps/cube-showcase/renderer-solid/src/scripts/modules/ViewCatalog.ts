import { ViewFactory } from 'wdc-cube-solid'

import { registerViews as registerAuthViews } from './auth'
import { registerViews as registerCyclesViews } from './cycles'
import { registerViews as registerIssuesViews } from './issues'
import { registerViews as registerMainViews } from './main'
import { registerViews as registerProjectsViews } from './projects'

export function registerAllViews() {
    const rv = ViewFactory.register

    registerMainViews(rv)
    registerAuthViews(rv)
    registerProjectsViews(rv)
    registerIssuesViews(rv)
    registerCyclesViews(rv)
}
