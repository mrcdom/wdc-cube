/* eslint-disable @typescript-eslint/no-unused-vars */

import lodash from 'lodash'
import { Logger } from '../utils/Logger'
import { PlaceUri } from './PlaceUri'
import { Scope } from './Scope'
import { ScopeUtils } from './ScopeUtils'

const LOG = Logger.get('IPresenter')

export interface IPresenter {

    release(): void

    emitBeforeScopeUpdate(): void

    applyParameters(uri: PlaceUri, initialization: boolean, deepest?: boolean): Promise<boolean>

    publishParameters(uri: PlaceUri): void

}

export interface IPresenterBase<S extends Scope> extends IPresenter {

    readonly scope: S

    isAutoUpdateEnabled(): boolean

    configureUpdate(vid: string, maxUpdate: number, scope: Scope): void

    update(optionalScope?: Scope): void

    onBeforeScopeUpdate(): void

}


function wrapViewAction(me: IPresenterBase<Scope>, impl: (...args: unknown[]) => Promise<void>) {
    return async function (...args: unknown[]) {
        try {
            return impl.apply(me, args)
        } finally {
            if (me.isAutoUpdateEnabled()) {
                me.update(me.scope)
            }
        }
    }
}

export function instrumentViewActions(this: IPresenterBase<Scope>) {
    const ctor = (this.constructor as unknown) as Record<string, unknown>

    if (!ctor.$$instrumented$$) {
        try {
            const proto = Object.getPrototypeOf(this) as Record<string, unknown>
            const methodNames = Object.getOwnPropertyNames(proto)
            for (const key of methodNames) {
                const value = proto[key]
                if (value !== this.onBeforeScopeUpdate && ScopeUtils.isAnActionName(key) && lodash.isFunction(value)) {
                    proto[key] = wrapViewAction(this, value)
                    LOG.debug(`action.${key}`)
                }
            }
        } finally {
            ctor.$$instrumented$$ = true
        }
    }
}