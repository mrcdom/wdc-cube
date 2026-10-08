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

    get siteId() {
        return this._intent.getParameterAsNumber(P.SiteId)
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
