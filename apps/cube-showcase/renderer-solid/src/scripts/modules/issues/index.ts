import { ViewFactory } from 'wdc-cube-solid'
import { IssueDetailScope, IssuesScope } from 'wdc-cube-showcase-presentation/issues'

import { IssueDetailView } from './v-issue-detail'
import { IssuesView } from './v-issues'

export function registerViews(rv = ViewFactory.register) {
    rv(IssuesScope, IssuesView)
    rv(IssueDetailScope, IssueDetailView)
}
