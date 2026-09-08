import type { Id, Issue } from '../../domain'
import { MainKeys } from '../main/main.key'
import { AttrIds, ParamIds, Places } from '../RouteConsts'

export class IssueDetailKeys extends MainKeys {
    public override get place() {
        return Places.issueDetail
    }

    public get projectId(): Id | undefined {
        return this._intent.getParameterAsString(ParamIds.ProjectId)
    }

    public set projectId(value: Id | undefined) {
        this._intent.setParameter(ParamIds.ProjectId, value)
    }

    public get issueId(): Id | undefined {
        return this._intent.getParameterAsString(ParamIds.IssueId)
    }

    public set issueId(value: Id | undefined) {
        this._intent.setParameter(ParamIds.IssueId, value)
    }

    /**
     * The record, when the caller already has it.
     *
     * An attribute rather than a parameter: it never reaches the URL, so opening
     * the issue from the list costs no request, and arriving by link still
     * works because the presenter fetches when this is absent.
     */
    public get issue(): Issue | undefined {
        return this._intent.attributes.get(AttrIds.issueDetail_issue) as Issue | undefined
    }

    public set issue(value: Issue | undefined) {
        this._intent.attributes.set(AttrIds.issueDetail_issue, value)
    }
}
