import { Observable, observe, Scope } from 'wdc-cube'

import type { SiteItemType } from '../../services/TutorialService'

@Observable
export class SubscriptionsScope extends Scope {
    @observe() sites = [] as SiteItemType[]

    // Actions
    onItemClicked = Scope.ASYNC_ACTION_ONE<SiteItemType>()
}