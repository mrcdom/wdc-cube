import type { Id } from '../../domain'
import { MainKeys } from '../main/main.key'
import { AttrIds, ParamIds, Places } from '../RouteConsts'
import type { ProjectPresenter } from './project.presenter'

/**
 * What every place inside a project understands.
 *
 * The dashboard, the issues, the cycles and the picker all extend this, because
 * they all stand inside `project` — so `projectId` is declared once instead of
 * being copied into four keys classes that happened to agree on the name.
 */
export class ProjectKeys extends MainKeys {
    public override get place() {
        return Places.project
    }

    // :: projectId

    public get projectId(): Id | undefined {
        return this._intent.getParameterAsString(ParamIds.ProjectId)
    }

    public set projectId(value: Id | undefined) {
        this._intent.setParameter(ParamIds.ProjectId, value)
    }

    // :: owner

    /**
     * The presenter that stands for the selected project.
     *
     * An attribute, so it never reaches the URL, and set by `ProjectPresenter`
     * on its way down: the framework walks the path from the root, so by the
     * time a place inside a project reads this, the place it sits inside has
     * already run. That is how a child asks for the record and the members
     * without fetching either again.
     *
     * Reaching for `app.getPresenter` instead would not work, and the reason is
     * worth keeping: presenters created during a flip are only committed to the
     * application when the whole flip succeeds, so during it the application
     * still answers with the previous ones.
     */
    public get owner(): ProjectPresenter | undefined {
        return this._intent.attributes.get(AttrIds.project_owner) as ProjectPresenter | undefined
    }

    public set owner(value: ProjectPresenter | undefined) {
        this._intent.attributes.set(AttrIds.project_owner, value)
    }
}
