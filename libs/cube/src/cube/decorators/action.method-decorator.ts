import _isFunction from 'lodash/isFunction'

import type { IPresenter } from '../IPresenter'

export function action() {
    return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
        if (_isFunction(descriptor.value)) {
            const instrumentedMethod = instrumentActionMethod(descriptor.value)

            Object.defineProperty(instrumentedMethod, 'name', {
                value: propertyKey + '_action',
                configurable: true
            })

            descriptor.value = instrumentedMethod
        }
    }
}

function instrumentActionMethod(impl: (...args: unknown[]) => unknown) {
    function onCatch(this: IPresenter, caught: unknown) {
        this.unexpected(`During execution of ${impl.name} action`, caught)
    }

    function onFinally(this: IPresenter) {
        const updateManager = this.updateManager
        if (updateManager.isAutoUpdateEnabled()) {
            this.updateIfNotDirty(this.scope)
            updateManager.emitBeforeScopeUpdate()
        }
    }

    return function (this: IPresenter, ...args: unknown[]) {
        try {
            const result = impl.call(this, ...args) as unknown

            // Result is a valid promise
            if (result && (result as Promise<unknown>).catch && (result as Promise<unknown>).finally) {
                return (result as Promise<unknown>).catch(onCatch.bind(this)).finally(onFinally.bind(this))
            }
            // Otherwhise, is a synchronous action
            else {
                onFinally.call(this)
                return result
            }
        } catch (caught) {
            // Will only be actioned on sincronus actions
            onCatch.call(this, caught)
            return undefined
        }
    }
}
