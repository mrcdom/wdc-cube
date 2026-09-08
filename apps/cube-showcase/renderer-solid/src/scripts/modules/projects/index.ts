import { ViewFactory } from 'wdc-cube-solid'
import { ProjectsScope } from 'wdc-cube-showcase-presentation/projects'

import { ProjectsView } from './v-projects'

export function registerViews(rv = ViewFactory.register) {
    rv(ProjectsScope, ProjectsView)
}
