/**
 * Copyright © 2025 WeDoCode Consultoria e Soluções Avançadas LTDA. All rights reserved.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import { isFunction } from '../utils/TypeGuards'

import { type IPresenter, actionOnCatch, actionOnFinally, isPromiseLike } from '../IPresenter'

/**
 * Wraps a presenter method with the action guard: error reporting, automatic
 * update and history refresh.
 *
 * @deprecated Prefer building the guard where the method is attached to the
 * scope, with `Presenter#action`:
 *
 * ```ts
 * this.scope.onSave = this.action(this.onSave)
 * ```
 *
 * That form makes it visible at the binding site which handlers are guarded and
 * which are not, and it can guard functions that are not methods of the class
 * itself (`this.action(fn, otherPresenter)`).
 */
export function action() {
    return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
        if (isFunction(descriptor.value)) {
            const instrumentedMethod = actionFn(descriptor.value)

            Object.defineProperty(instrumentedMethod, 'name', {
                value: propertyKey + '_action',
                configurable: true
            })

            descriptor.value = instrumentedMethod
        }
    }
}

function actionFn(impl: (...args: unknown[]) => Promise<void>) {
    return function (this: IPresenter, ...args: unknown[]): Promise<void> {
        const fnName = `${this.constructor.name}.${impl.name}`

        try {
            const result = impl.call(this, ...args) as unknown

            // Asynchronous action
            if (isPromiseLike(result)) {
                return (result as Promise<void>)
                    .catch((caught) => actionOnCatch(this, fnName, caught))
                    .finally(() => actionOnFinally(this))
            }

            // Synchronous action
            actionOnFinally(this)
            return Promise.resolve()
        } catch (caught) {
            actionOnCatch(this, fnName, caught)
            actionOnFinally(this)
            return Promise.resolve()
        }
    }
}
