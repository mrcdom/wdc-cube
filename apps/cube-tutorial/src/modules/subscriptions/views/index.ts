import { ViewFactory } from 'wdc-cube-react'
import { SubscriptionsScope } from '../Subscriptions.scopes'
import { SubscriptionsView } from './Subscriptions.view'
import { SubscriptionsDetailScope } from '../SubscriptionsDetail.scopes'
import { SubscriptionsDetailView } from './SubscriptionsDetail.view'

export function registerViews(rv = ViewFactory.register) {
    rv(SubscriptionsScope, SubscriptionsView)
    rv(SubscriptionsDetailScope, SubscriptionsDetailView)
}