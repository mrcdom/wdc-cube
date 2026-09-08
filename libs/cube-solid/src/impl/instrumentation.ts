/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import { createSignal, type Signal } from 'solid-js'
import {
    Observable,
    observedProperty,
    type FieldMetadata,
    type GenericObject,
    type ScopeInstrumentation
} from 'wdc-cube'

/** Where a scope keeps the signal standing behind each of its observed fields. */
const SIGNALS = Symbol('wdc-cube-solid:signals')

type Instrumented = { [SIGNALS]?: Map<string, Signal<unknown>> }

/**
 * How a scope reports its changes when SolidJS is drawing.
 *
 * The framework's own accessor is what still compares, stores, and calls
 * `scope.update` — this asks for it by name and wraps it, so a change means
 * exactly what it meant before. What is added is a signal per field, created on
 * the instance the first time that field is touched.
 *
 * That is the whole difference between the two renderers of the same
 * presentation layer. Under the default, a field changing marks the scope and a
 * view redraws. Under this one, a field changing wakes the expressions that read
 * that field, and nothing else in the page moves.
 */
export const solidInstrumentation: ScopeInstrumentation = (prototype: GenericObject, fields: FieldMetadata[]) => {
    for (const field of fields) {
        Reflect.defineProperty(prototype, field.key, signalBacked(field, observedProperty(field.key)))
    }
}

/**
 * Installs the instrumentation. Call it before anything constructs a scope —
 * the framework says so with an exception if it is late.
 */
export function useSolidScopes(): void {
    Observable.setInstrumentation(solidInstrumentation)
}

function signalBacked(field: FieldMetadata, base: PropertyDescriptor): PropertyDescriptor {
    const read = base.get
    const write = base.set

    if (!read || !write) {
        return base
    }

    return {
        configurable: base.configurable,
        enumerable: base.enumerable,

        get(this: Instrumented) {
            return signalOf(this, field.key, read)[0]()
        },

        set(this: Instrumented, value: unknown) {
            write.call(this, value)
            // Read back rather than trusting `value`: the framework's setter is
            // what decides whether the write was taken.
            signalOf(this, field.key, read)[1](() => read.call(this))
        }
    }
}

function signalOf(target: Instrumented, key: string, read: () => unknown): Signal<unknown> {
    let signals = target[SIGNALS]
    if (!signals) {
        signals = new Map()
        Object.defineProperty(target, SIGNALS, { value: signals, enumerable: false })
    }

    let signal = signals.get(key)
    if (!signal) {
        signal = createSignal(read.call(target))
        signals.set(key, signal)
    }

    return signal
}
