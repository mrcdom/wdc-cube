import { ViewFactory } from 'wdc-cube-solid'
import { SubscriptionsDetailScope, SubscriptionsScope } from 'wdc-cube-tutorial-presentation/subscriptions'

import { SubscriptionsDetailView } from './v-subscriptions-detail'
import { SubscriptionsView } from './v-subscriptions'

export function registerViews(rv = ViewFactory.register) {
    rv(SubscriptionsScope, SubscriptionsView)
    rv(SubscriptionsDetailScope, SubscriptionsDetailView)
}
