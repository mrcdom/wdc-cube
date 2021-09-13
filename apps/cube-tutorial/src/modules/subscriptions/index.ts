import { ViewFactory } from 'wdc-cube-react'
import { ViewIds } from '../../Constants'
import { SubscriptionsView } from './Subscriptions.view'
import { SubscriptionsDetailView } from './detail/SubscriptionsDetail.view'

export function registerSubscriptionsViews() {
    const rv = ViewFactory.register
    rv(ViewIds.subscriptions, SubscriptionsView)
    rv(ViewIds.subscriptionsDetail, SubscriptionsDetailView)
}