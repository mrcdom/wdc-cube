import { Places } from '../RouteConsts'
import { MainKeys } from '../main/main.key'

/** This file's name prefix - unique in the application. */
const PREFIX = 'tm'

const P = {
    UserId: `${PREFIX}-uid`,
    Showing: `${PREFIX}-showing`
} as const

export enum ShowingOptions {
    ALL,
    ACTIVE,
    COMPLETED
}

export class TodoMvcKeys extends MainKeys {
    get place() {
        return Places.todos
    }

    // :: userId

    get userId() {
        return this._intent.getParameterAsNumber(P.UserId)
    }

    set userId(value: number | undefined) {
        this._intent.setParameter(P.UserId, value)
    }

    // :: showing

    get showing() {
        return this._intent.getParameterAsNumber(P.Showing) as ShowingOptions | undefined
    }

    set showing(value: ShowingOptions | undefined) {
        this._intent.setParameter(P.Showing, value)
    }
}
