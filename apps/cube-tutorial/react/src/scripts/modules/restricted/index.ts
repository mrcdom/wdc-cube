import { ViewFactory } from 'wdc-cube-react'
import { RestrictedScope } from 'wdc-cube-tutorial-app/restricted'
import { RestrictedView } from './v-restricted'

export function registerViews(rv = ViewFactory.register) {
    rv(RestrictedScope, RestrictedView)
}
