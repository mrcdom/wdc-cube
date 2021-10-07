import { ViewFactory } from 'wdc-cube-react'
import { RestrictedScope } from '../Restricted.scopes'
import { RestrictedView } from './Restricted.view'

export function registerViews(rv = ViewFactory.register) {
    rv(RestrictedScope, RestrictedView)
}