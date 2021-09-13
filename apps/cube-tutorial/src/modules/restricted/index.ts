import { ViewFactory } from 'wdc-cube-react'
import { ViewIds } from '../../Constants'
import { RestrictedView } from './Restricted.view'

export function registerRestrictedViews() {
    const rv = ViewFactory.register
    rv(ViewIds.restricted, RestrictedView)
}