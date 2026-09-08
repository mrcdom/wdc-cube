import type { Id } from '../../domain'
import { MainKeys } from '../main/main.key'
import { ParamIds, Places } from '../RouteConsts'

export class CyclesKeys extends MainKeys {
    public override get place() {
        return Places.cycles
    }

    public get projectId(): Id | undefined {
        return this._intent.getParameterAsString(ParamIds.ProjectId)
    }

    public set projectId(value: Id | undefined) {
        this._intent.setParameter(ParamIds.ProjectId, value)
    }
}
