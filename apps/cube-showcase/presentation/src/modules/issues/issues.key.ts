import type { Id, IssuePriority, IssueState } from '../../domain'
import { ProjectKeys } from '../project/project.key'
import { ParamIds, Places } from '../RouteConsts'

/** Which drawing of the same list of issues. */
export type IssueView = 'list' | 'board' | 'table'

/**
 * Everything the issue list can be looking at.
 *
 * This class is the showcase's argument in one file. A filter, a page and the
 * chosen view are parameters of a place, so the address bar carries them: a
 * colleague can be sent the exact list you are looking at, a reload lands back
 * on it, and Back steps through the filters you tried. No view stores any of
 * this, and no code was written to keep the URL in step — the URL *is* the
 * state, read through here.
 */
export class IssuesKeys extends ProjectKeys {
    public override get place() {
        return Places.issues
    }

    // :: view

    public get view(): IssueView {
        const value = this._intent.getParameterAsString(ParamIds.View)
        return value === 'board' || value === 'table' ? value : 'list'
    }

    public set view(value: IssueView) {
        // The default is absent rather than spelled out: a plain list should have
        // a plain URL, and `?view=list` is noise a reader would have to ignore.
        this._intent.setParameter(ParamIds.View, value === 'list' ? undefined : value)
    }

    // :: sort

    /**
     * The ordering, as one string: `priority` ascending, `-priority` descending.
     *
     * One parameter rather than two because it is one decision, and because a
     * link should read as a sentence rather than as a form submission.
     */
    public get sort(): string | undefined {
        return this._intent.getParameterAsString(ParamIds.Sort)
    }

    public set sort(value: string | undefined) {
        this._intent.setParameter(ParamIds.Sort, value ? value : undefined)
    }

    // :: filters

    public get state(): IssueState | undefined {
        return this._intent.getParameterAsString(ParamIds.State) as IssueState | undefined
    }

    public set state(value: IssueState | undefined) {
        this._intent.setParameter(ParamIds.State, value)
    }

    public get priority(): IssuePriority | undefined {
        return this._intent.getParameterAsString(ParamIds.Priority) as IssuePriority | undefined
    }

    public set priority(value: IssuePriority | undefined) {
        this._intent.setParameter(ParamIds.Priority, value)
    }

    public get assigneeId(): Id | undefined {
        return this._intent.getParameterAsString(ParamIds.AssigneeId)
    }

    public set assigneeId(value: Id | undefined) {
        this._intent.setParameter(ParamIds.AssigneeId, value)
    }

    public get cycleId(): Id | undefined {
        return this._intent.getParameterAsString(ParamIds.CycleId)
    }

    public set cycleId(value: Id | undefined) {
        this._intent.setParameter(ParamIds.CycleId, value)
    }

    public get search(): string | undefined {
        return this._intent.getParameterAsString(ParamIds.Search)
    }

    public set search(value: string | undefined) {
        this._intent.setParameter(ParamIds.Search, value ? value : undefined)
    }

    // :: page

    public get page(): number {
        return this._intent.getParameterAsNumber(ParamIds.Page) ?? 1
    }

    public set page(value: number) {
        this._intent.setParameter(ParamIds.Page, value > 1 ? value : undefined)
    }
}
