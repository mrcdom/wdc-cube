import { ViewFactory } from 'wdc-cube-solid'
import { SignInScope } from 'wdc-cube-showcase-presentation/auth'

import { SignInView } from './v-sign-in'

export function registerViews(rv = ViewFactory.register) {
    rv(SignInScope, SignInView)
}
