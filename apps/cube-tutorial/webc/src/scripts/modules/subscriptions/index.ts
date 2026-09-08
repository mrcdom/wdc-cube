import type { ViewFactory } from 'wdc-cube-webc'
import { SubscriptionsDetailScope, SubscriptionsScope } from 'wdc-cube-tutorial-app/subscriptions'

import { SubscriptionsDetailView } from './v-subscriptions-detail'
import { SubscriptionsView } from './v-subscriptions'

export function registerViews(define: (typeof ViewFactory)['define']) {
    define('v-subscriptions', SubscriptionsScope, SubscriptionsView)
    define('v-subscriptions-detail', SubscriptionsDetailScope, SubscriptionsDetailView)
}
