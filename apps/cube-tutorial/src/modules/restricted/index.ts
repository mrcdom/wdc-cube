import { ViewFactory } from 'wdc-cube-react'
import { RestrictedScope } from './Restricted.presenter'
import { RestrictedView } from './Restricted.view'

export function registerRestrictedViews() {
    const rv = ViewFactory.register
    rv(RestrictedScope, RestrictedView)
}