import { ViewFactory } from 'wdc-cube-react'
import { RestrictedScope } from '../restricted.scope'
import { RestrictedView } from './v-restricted'

export function registerViews(rv = ViewFactory.register) {
    rv(RestrictedScope, RestrictedView)
}
