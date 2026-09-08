import { CubeBuilder, Place } from 'wdc-cube'

import { SignInPresenter } from './auth/auth.presenter'
import { CyclesPresenter } from './cycles/cycles.presenter'
import { DashboardPresenter } from './dashboard/dashboard.presenter'
import { IssueDetailPresenter } from './issues/issue-detail.presenter'
import { IssuesPresenter } from './issues/issues.presenter'
import { ProjectsPresenter } from './projects/projects.presenter'
import { Places } from './RouteConsts'

/**
 * The place tree, which is also the URL.
 *
 * Nesting here is nesting there: `issues/detail` sits under `projects`, so a
 * detail is reached with the list already standing behind it. That is what lets
 * the dialog be a place rather than a piece of view state.
 */
const prepare = CubeBuilder.lazyBuild({
    'sign-in': {
        presenter: Place.creator(SignInPresenter, Places, 'signIn')
    },

    projects: {
        presenter: Place.creator(ProjectsPresenter, Places, 'projects'),

        issues: {
            presenter: Place.creator(IssuesPresenter, Places, 'issues'),

            detail: {
                presenter: Place.creator(IssueDetailPresenter, Places, 'issueDetail')
            }
        },

        cycles: {
            presenter: Place.creator(CyclesPresenter, Places, 'cycles')
        },

        dashboard: {
            presenter: Place.creator(DashboardPresenter, Places, 'dashboard')
        }
    }
})

export function initialize() {
    prepare()
    return Places
}
