/* eslint-disable @typescript-eslint/no-unused-vars */

import lodash from 'lodash'
import { PlaceUri } from './PlaceUri'
import { Scope } from './Scope'
import { ScopeUtils } from './ScopeUtils'

export interface IPresenter {

    release(): void

    isAutoUpdateEnabled(): boolean

    isDirty(): boolean

    update(optionalScope?: Scope): void

    emitBeforeScopeUpdate(force?: boolean): void

    applyParameters(uri: PlaceUri, initialization: boolean, deepest?: boolean): Promise<boolean>

    publishParameters(uri: PlaceUri): void

}

export interface IPresenterBase<S extends Scope> extends IPresenter {

    readonly scope: S

    configureUpdate(vid: string, maxUpdate: number, scope: Scope): void

    onBeforeScopeUpdate(): void

}


function wrapViewAction(impl: (...args: unknown[]) => Promise<void>) {
    function onFinally(this: IPresenterBase<Scope>) {
        if (this.isAutoUpdateEnabled()) {
            this.emitBeforeScopeUpdate(true)
        }
    }

    return function (this: IPresenterBase<Scope>, ...args: unknown[]) {
        const result = impl.apply(this, args)
        result.finally(onFinally.bind(this))
        return result
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
                    proto[key] = wrapViewAction(value)
                }
            }
        } finally {
            ctor.$$instrumented$$ = true
        }
    }
}