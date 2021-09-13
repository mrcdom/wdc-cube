import { ViewFactory } from 'wdc-cube-react'
import { ViewIds } from '../../Constants'
import { SubscriptionsView } from './Subscriptions.view'
import { SubscriptionsDetailView } from './SubscriptionsDetail.view'

export function registerSubscriptionsViews() {
    const rv = ViewFactory.register
    rv(ViewIds.module2, SubscriptionsView)
    rv(ViewIds.module2Detail, SubscriptionsDetailView)
}