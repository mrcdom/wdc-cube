/**
 * Copyright © 2025 WeDoCode Consultoria e Soluções Avançadas LTDA. All rights reserved.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import _isFunction from 'lodash/isFunction'

import { type IPresenter, mkAction } from '../IPresenter'

export function action() {
    return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
        if (_isFunction(descriptor.value)) {
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
    function onCatch(this: IPresenter, caught: unknown) {
        this.unexpected(`During execution of ${impl.name} action`, caught)
    }

    function onFinally(this: IPresenter) {
        const updateManager = this.updateManager
        if (updateManager.isAutoUpdateEnabled()) {
            this.updateIfNotDirty(this.scope)
            updateManager.emitBeforeScopeUpdate()
        }
        this.updateHistory()
    }

    return function (this: IPresenter, ...args: unknown[]): Promise<void> {
        try {
            const result = impl.call(this, ...args) as unknown

            // Result is a valid promise
            if (result && (result as Promise<void>).catch && (result as Promise<unknown>).finally) {
                return (result as Promise<void>).catch(onCatch.bind(this)).finally(onFinally.bind(this))
            }
            // Otherwhise, is a synchronous action
            else {
                onFinally.call(this)
                return result as Promise<void>
            }
        } catch (caught) {
            // Will only be actioned on sincronus actions
            onCatch.call(this, caught)
            return Promise.resolve(void 0)
        }
    }
}
