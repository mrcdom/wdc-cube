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
 * Makes a scope class report its changes: given the fields `@observe()`
 * catalogued, install whatever accessors that reporting needs.
 *
 * This is the whole of what `@Observable` does to a class, and a view
 * technology can take it over. What comes back through those accessors is then
 * that technology's business — a scope-wide notification, as the default does,
 * or a signal per field, as SolidJS wants.
 */
export type ScopeInstrumentation = (prototype: GenericObject, fields: FieldMetadata[]) => void

/**
 * The accessor the framework installs for one field: it compares, stores, and
 * tells the scope it changed.
 *
 * Exported so an instrumentation can wrap it instead of restating it. What a
 * change *means* is worth keeping in one place even when what it *notifies* is
 * not.
 */
export function observedProperty(key: string): PropertyDescriptor {
    return buildObservedProperty(key)
}

/** What the framework does when nothing takes over. */
export const defaultInstrumentation: ScopeInstrumentation = (prototype, fields) => {
    for (const field of fields) {
        Reflect.defineProperty(prototype, field.key, observedProperty(field.key))
    }
}

let instrumentation: ScopeInstrumentation = defaultInstrumentation
let instrumented = false

export function Observable<T extends { new (...args: any[]): object }>(ctor: T) {
    let init = (prototype: GenericObject, fields: FieldMetadata[]) => {
        instrumentation(prototype, fields)
        instrumented = true

        // Independent of who instrumented: a field initialised in the
        // constructor landed as an own property, so it is read back, removed,
        // and written again through whatever accessor was just installed.
        const actions: string[] = []
        for (let index = 0; index < fields.length; index++) {
            const field = fields[index]
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
 * Hands the instrumentation of every scope in the application to someone else.
 *
 * The default reports at the scope: a field changes, `scope.update` is called,
 * and a binding redraws from `forceUpdate`. That is what React, Angular and the
 * custom elements all want. A view technology with a finer idea of a change —
 * SolidJS, whose whole point is that one field moving should wake one
 * expression — installs its own accessors here rather than layering a second
 * set on top of these.
 *
 * It has to be set before the first scope is constructed, because the accessors
 * are installed on a class the first time one of its instances exists. Setting
 * it after that throws rather than leaving half an application reactive and the
 * other half not.
 */
Observable.setInstrumentation = (next: ScopeInstrumentation = defaultInstrumentation): void => {
    if (instrumented) {
        throw new Error(
            'Observable.setInstrumentation must be called before the first scope is constructed: ' +
                'by now some scope classes already carry the previous accessors.'
        )
    }
    instrumentation = next
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
