/* eslint-disable @typescript-eslint/no-explicit-any */

import { NOOP_VOID } from '../../utils/EmptyFunctions'
import { Scope } from '../Scope'

export type GenericObject = Record<string | symbol, unknown>

export type FieldMetadata = {
    key: string
    type: unknown
}

const COPY_INITIAL_VALUES_ACTION = Symbol('wdc-cube:initializeValues')

export function Observable<T extends { new (...args: any[]): object }>(ctor: T) {
    let init = (prototype: GenericObject, fields: FieldMetadata[]) => {
        const actions: string[] = []
        for (let index = 0; index < fields.length; index++) {
            const field = fields[index]
            Reflect.defineProperty(prototype, field.key, buildObservedProperty(field.key))
            actions.push(`const v${index} = this.${field.key};`)
            actions.push(`Reflect.deleteProperty(this, '${field.key}');`)
            actions.push(`this.${field.key} = v${index};`)
        }
        prototype[COPY_INITIAL_VALUES_ACTION] = new Function(actions.join('\n'))
        init = NOOP_VOID
    }

    const observableScopeClass = class extends ctor {
        constructor(...args: any[]) {
            super(...args)
            const me = this as unknown as GenericObject

            const fields = me[Observable.PROPERTY_OBSERVERS_METADATA] as FieldMetadata[]
            if (fields) {
                init(observableScopeClass.prototype, fields)
                Reflect.apply(observableScopeClass.prototype[COPY_INITIAL_VALUES_ACTION], this, [])
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
