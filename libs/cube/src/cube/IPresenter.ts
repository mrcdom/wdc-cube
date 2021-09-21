/* eslint-disable @typescript-eslint/no-unused-vars */

import lodash from 'lodash'
import { PlaceUri } from './PlaceUri'
import { Scope, ScopeType } from './Scope'
import { ScopeUtils } from './ScopeUtils'

export interface IPresenter {

    release(): void

    isAutoUpdateEnabled(): boolean

    isDirty(): boolean

    update(optionalScope?: Scope): void

    emitBeforeScopeUpdate(force?: boolean): void

    applyParameters(uri: PlaceUri, initialization: boolean, last?: boolean): Promise<boolean>

    publishParameters(uri: PlaceUri): void

}

export interface IPresenterBase<S extends Scope> extends IPresenter {

    readonly scope: S

    configureUpdate(scopeCtor: ScopeType, maxUpdate: number, scope: Scope): void

    onBeforeScopeUpdate(): void

    unexpected(message: string, error: unknown): void

}

function wrapViewAction(impl: (...args: unknown[]) => Promise<void>) {
    function onCatch(this: IPresenterBase<Scope>, caught: unknown) {
        this.unexpected(`During execution of ${impl.name} action`, caught)
    }

    function onFinally(this: IPresenterBase<Scope>) {
        if (this.isAutoUpdateEnabled()) {
            this.emitBeforeScopeUpdate(true)
        }
    }

    return function (this: IPresenterBase<Scope>, ...args: unknown[]) {
        try {
            const result = impl.apply(this, args) as unknown

            // Result is a valid promise
            if (result && (result as Promise<unknown>).catch && (result as Promise<unknown>).finally) {
                return (result as Promise<unknown>)
                    .catch(onCatch.bind(this))
                    .finally(onFinally.bind(this))
            }
            // Otherwhise, is a synchronous action
            else {
                onFinally.bind(this)
                return result
            }
        } catch (caught) {
            // Will only be actioned on sincronus actions
            onCatch.bind(this, caught)
            return undefined
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
                    proto[key] = wrapViewAction(value)
                }
            }
        } finally {
            ctor.$$instrumented$$ = true
        }
    }
}