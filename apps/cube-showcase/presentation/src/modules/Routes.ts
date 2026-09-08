import { CubeBuilder, Place } from 'wdc-cube'

import { SignInPresenter } from './auth/auth.presenter'
import { CyclesPresenter } from './cycles/cycles.presenter'
import { DashboardPresenter } from './dashboard/dashboard.presenter'
import { IssueDetailPresenter } from './issues/issue-detail.presenter'
import { IssuesPresenter } from './issues/issues.presenter'
import { ProjectPresenter } from './project/project.presenter'
import { ProjectsPresenter } from './projects/projects.presenter'
import { Places } from './RouteConsts'

/**
 * The place tree, which is also the URL.
 *
 * Nesting says what a place stands inside, not how a reader got there. Issues
 * belong to *a project* rather than to the list of projects, so `project` is the
 * parent and holds what all four have in common — the session, the selected
 * project, its record and its people, the sidebar. Choosing a different project
 * is one of those four, which is why `projects` sits beside them rather than
 * above them.
 *
 * `issues/detail` nests one level further for the same reason read the other
 * way: a detail is reached with the list already standing behind it, which is
 * what lets the dialog be a place rather than a piece of view state.
 */
const prepare = CubeBuilder.lazyBuild({
    'sign-in': {
        presenter: Place.creator(SignInPresenter, Places, 'signIn')
    },

    project: {
        presenter: Place.creator(ProjectPresenter, Places, 'project'),

        projects: {
            presenter: Place.creator(ProjectsPresenter, Places, 'projects')
        },

        dashboard: {
            presenter: Place.creator(DashboardPresenter, Places, 'dashboard')
        },

        issues: {
            presenter: Place.creator(IssuesPresenter, Places, 'issues'),

            detail: {
                presenter: Place.creator(IssueDetailPresenter, Places, 'issueDetail')
            }
        },

        cycles: {
            presenter: Place.creator(CyclesPresenter, Places, 'cycles')
        }
    }
})

export function initialize() {
    prepare()
    return Places
}
