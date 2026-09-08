/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Scope } from '../Scope'

export type GenericObject = Record<string | symbol, unknown>

export type FieldMetadata = {
    key: string
    type: unknown
}

const COPY_INITIAL_VALUES_ACTION: symbol = Symbol('wdc-cube:initializeValues')

/**
 * Builds the accessor an `@observe()` field gets.
 *
 * `base` is the one this module would have installed: it compares, stores, and
 * tells the scope it changed. A provider is expected to wrap it rather than
 * replace it, so that what a change *means* stays defined in one place and only
 * what a change *notifies* is the provider's business.
 */
export type ObservedPropertyProvider = (field: FieldMetadata, base: PropertyDescriptor) => PropertyDescriptor

let provider: ObservedPropertyProvider | undefined
let instrumented = false

export function Observable<T extends { new (...args: any[]): object }>(ctor: T) {
    let init = (prototype: GenericObject, fields: FieldMetadata[]) => {
        const actions: string[] = []
        for (let index = 0; index < fields.length; index++) {
            const field = fields[index]
            const base = buildObservedProperty(field.key)
            Reflect.defineProperty(prototype, field.key, provider ? provider(field, base) : base)
            instrumented = true
            actions.push(`const v${index} = this.${field.key};`)
            actions.push(`Reflect.deleteProperty(this, '${field.key}');`)
            actions.push(`this.${field.key} = v${index};`)
        }
        const copyInitialValuesAction = new Function(actions.join('\n'))
        prototype[COPY_INITIAL_VALUES_ACTION] = copyInitialValuesAction
        init = () => copyInitialValuesAction
        return copyInitialValuesAction
    }

    const observableScopeClass = class extends ctor {
        constructor(...args: any[]) {
            super(...args)
            const me = this as unknown as GenericObject

            const fields = me[Observable.PROPERTY_OBSERVERS_METADATA] as FieldMetadata[]
            if (fields) {
                const copyInitialValues = init(observableScopeClass.prototype as unknown as GenericObject, fields)
                copyInitialValues.call(this)
            }
        }
    }

    Reflect.defineProperty(observableScopeClass, 'name', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: `Observable${ctor.name}`
    })

    return observableScopeClass
}

Observable.PROPERTY_OBSERVERS_METADATA = Symbol('wdc-cube:scope_observers')

/**
 * Decides how an observed field notifies, for every scope in the application.
 *
 * The default is the accessor below: a comparison, a write, and a call to
 * `scope.update`, which is what every binding built on `forceUpdate` needs. A
 * view technology with a finer idea of a change — SolidJS, whose whole point is
 * that one field moving should wake one expression — supplies its own here and
 * takes over the instrumentation instead of layering a second one on top of it.
 *
 * It has to be set before the first scope is constructed, because the accessors
 * are installed on a class the first time one of its instances exists. Setting
 * it after that throws rather than leaving half an application reactive and the
 * other half not.
 */
Observable.setProvider = (next?: ObservedPropertyProvider): void => {
    if (instrumented) {
        throw new Error(
            'Observable.setProvider must be called before the first scope is constructed: ' +
                'by now some scope classes already carry the previous accessors.'
        )
    }
    provider = next
}

function buildObservedProperty(key: string): PropertyDescriptor {
    const privateKey = Symbol(key)
    return {
        configurable: false,
        enumerable: true,
        get: function (this: Record<string | symbol, unknown>) {
            return this[privateKey]
        },
        set: function (this: Record<string | symbol, unknown>, newValue: unknown) {
            if (this[privateKey] !== newValue) {
                this[privateKey] = newValue
                const scope = this as unknown as Scope
                scope.update(scope)
            }
        }
    }
}
