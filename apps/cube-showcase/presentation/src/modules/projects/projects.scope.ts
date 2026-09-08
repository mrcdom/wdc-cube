import { Observable, observe, Scope } from 'wdc-cube'

import type { Project } from '../../domain'

/** One project card. A scope per row, which is what lets a row redraw alone. */
@Observable
export class ProjectCardScope extends Scope {
    @observe() name = ''
    @observe() projectKey = ''
    @observe() description = ''
    @observe() hue = 0
    @observe() issueCount = 0
    @observe() leadName = ''

    onOpen = Scope.ASYNC_ACTION
}

@Observable
export class ProjectsScope extends Scope {
    @observe() loading = true
    @observe() error?: string
    @observe() projects: ProjectCardScope[] = []
}

export type { Project }
