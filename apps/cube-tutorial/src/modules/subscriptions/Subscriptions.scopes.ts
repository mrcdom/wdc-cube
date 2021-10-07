import { Scope } from 'wdc-cube'

import type { SiteItemType } from '../../services/TutorialService'

export class SubscriptionsScope extends Scope {
    sites = [] as SiteItemType[]

    // Actions
    onItemClicked = Scope.ASYNC_ACTION_ONE<SiteItemType>()
}