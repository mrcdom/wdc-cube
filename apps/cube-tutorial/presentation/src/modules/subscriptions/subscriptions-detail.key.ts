import { Places } from '../RouteConsts'
import { MainKeys } from '../main/main.key'
import { type SiteItemType } from '../../services/TutorialService'

/** This file's name prefix - unique in the application. */
const PREFIX = 'sd'

/** Parameters: they go to the address. */
const P = {
    SiteId: `${PREFIX}-site`
} as const

/** Attributes: they travel with the intent, and never reach the address. */
const A = {
    item: `${PREFIX}-item`
} as const

export class SubstriptionsDetailKeys extends MainKeys {
    get place() {
        return Places.subscriptionsDetail
    }

    // :: siteId

    /** A positive integer, or `undefined` when the address carries none it can use. */
    get siteId(): number | undefined {
        const value = this._intent.getParameterAsNumber(P.SiteId)
        return value !== undefined && Number.isSafeInteger(value) && value > 0 ? value : undefined
    }

    set siteId(siteId: number | undefined) {
        this._intent.setParameter(P.SiteId, siteId)
    }

    // :: item

    get item() {
        return this._intent.attributes.get(A.item) as SiteItemType | undefined
    }

    set item(item: SiteItemType | undefined) {
        this._intent.attributes.set(A.item, item)
    }
}
