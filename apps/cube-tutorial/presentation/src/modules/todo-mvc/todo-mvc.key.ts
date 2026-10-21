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

const SHOWING: readonly ShowingOptions[] = [ShowingOptions.ALL, ShowingOptions.ACTIVE, ShowingOptions.COMPLETED]

export class TodoMvcKeys extends MainKeys {
    get place() {
        return Places.todos
    }

    // The address is outside input: anyone can edit it, and an old link can carry a value
    // that no longer means anything. The getters only ever hand back something usable, and
    // since the same keys publish, whatever was refused drops out of the address by itself.

    // :: userId

    /** Which list to show: 0 is the sample, a negative id the 1000-item generator. */
    get userId(): number {
        const value = this._intent.getParameterAsNumber(P.UserId)
        return value !== undefined && Number.isSafeInteger(value) ? value : 0
    }

    set userId(value: number | undefined) {
        // The default stays out of the address.
        this._intent.setParameter(P.UserId, value ? value : undefined)
    }

    // :: showing

    get showing(): ShowingOptions {
        const value = this._intent.getParameterAsNumber(P.Showing)
        return SHOWING.includes(value as ShowingOptions) ? (value as ShowingOptions) : ShowingOptions.ALL
    }

    set showing(value: ShowingOptions | undefined) {
        this._intent.setParameter(P.Showing, value === ShowingOptions.ALL ? undefined : value)
    }
}
