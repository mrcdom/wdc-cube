import { Places, ParamIds } from '../../Constants'
import { MainKeys } from '../../main/Main.keys'

export enum ShowingOptions {
    ALL,
    ACTIVE,
    COMPLETED
}

export class TodoMvcKeys extends MainKeys {
    get place() {
        return Places.subscriptions
    }

    // :: userId

    get userId() {
        return this._intent.getParameterAsNumber(ParamIds.TodoUserId)
    }

    set userId(value: number | undefined) {
        this._intent.setParameter(ParamIds.TodoUserId, value)
    }

    // :: showing

    get showing() {
        return this._intent.getParameterAsNumber(ParamIds.TodoShowing) as ShowingOptions | undefined
    }

    set showing(value: ShowingOptions | undefined) {
        this._intent.setParameter(ParamIds.TodoShowing, value)
    }
}
