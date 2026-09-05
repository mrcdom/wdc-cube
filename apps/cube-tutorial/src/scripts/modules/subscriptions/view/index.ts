import { ViewFactory } from 'wdc-cube-react'
import { SubscriptionsScope } from '../subscriptions.scope'
import { SubscriptionsView } from './v-subscriptions'
import { SubscriptionsDetailScope } from '../subscriptions-detail.scope'
import { SubscriptionsDetailView } from './v-subscriptions-detail'

export function registerViews(rv = ViewFactory.register) {
    rv(SubscriptionsScope, SubscriptionsView)
    rv(SubscriptionsDetailScope, SubscriptionsDetailView)
}
