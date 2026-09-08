import { ViewFactory } from 'wdc-cube-react'
import { SubscriptionsScope } from 'wdc-cube-tutorial-presentation/subscriptions'
import { SubscriptionsView } from './v-subscriptions'
import { SubscriptionsDetailScope } from 'wdc-cube-tutorial-presentation/subscriptions'
import { SubscriptionsDetailView } from './v-subscriptions-detail'

export function registerViews(rv = ViewFactory.register) {
    rv(SubscriptionsScope, SubscriptionsView)
    rv(SubscriptionsDetailScope, SubscriptionsDetailView)
}
