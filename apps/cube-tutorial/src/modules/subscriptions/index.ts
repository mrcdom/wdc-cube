import { ViewFactory } from 'wdc-cube-react'
import { SubscriptionsScope } from './Subscriptions.presenter'
import { SubscriptionsView } from './Subscriptions.view'

import { SubscriptionsDetailScope } from './detail/SubscriptionsDetail.presenter'
import { SubscriptionsDetailView } from './detail/SubscriptionsDetail.view'

export function registerSubscriptionsViews() {
    const rv = ViewFactory.register
    rv(SubscriptionsScope, SubscriptionsView)
    rv(SubscriptionsDetailScope, SubscriptionsDetailView)
}