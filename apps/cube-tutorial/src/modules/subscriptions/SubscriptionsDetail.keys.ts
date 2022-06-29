import { Places, ParamIds, AttrIds } from '../../Constants'
import { MainKeys } from '../../main/Main.keys'
import { SiteItemType } from '../../services/TutorialService'

export class SubstriptionsDetailKeys extends MainKeys {
    get place() {
        return Places.subscriptionsDetail
    }

    // :: siteId

    get siteId() {
        return this._intent.getParameterAsNumber(ParamIds.SiteId)
    }

    set siteId(siteId: number | undefined) {
        this._intent.setParameter(ParamIds.SiteId, siteId)
    }

    // :: item

    get item() {
        return this._intent.attributes.get(AttrIds.subscriptionsDetail_item) as SiteItemType | undefined
    }

    set item(item: SiteItemType | undefined) {
        this._intent.attributes.set(AttrIds.subscriptionsDetail_item, item)
    }
}
