/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import { createSignal, type Signal } from 'solid-js'
import { Observable, type FieldMetadata, type ObservedPropertyProvider } from 'wdc-cube'

/** Where a scope keeps the signal standing behind each of its observed fields. */
const SIGNALS = Symbol('wdc-cube-solid:signals')

type Instrumented = { [SIGNALS]?: Map<string, Signal<unknown>> }

/**
 * The accessor an observed field gets when SolidJS is drawing.
 *
 * It wraps the one the framework would have installed rather than replacing it:
 * the comparison, the write and the call to `scope.update` all still happen
 * there, so a change means exactly what it meant before. What this adds is the
 * signal — created per instance, on first use — so that reading `scope.title`
 * inside a view subscribes to that field and to nothing else.
 *
 * This is why the binding does not have to re-instrument anything. There is one
 * accessor per field, installed once, and no way to write to a field without
 * going through it.
 */
export const solidObservedProperty: ObservedPropertyProvider = (
    field: FieldMetadata,
    base: PropertyDescriptor
): PropertyDescriptor => {
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

/**
 * Installs the provider. Call it before anything constructs a scope — the
 * framework says so with an exception if it is late.
 */
export function useSolidScopes(): void {
    Observable.setProvider(solidObservedProperty)
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
