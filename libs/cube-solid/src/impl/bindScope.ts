/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import { batch, createSignal, onCleanup } from 'solid-js'
import { NOOP_VOID, ObservableArray, type Scope } from 'wdc-cube'

/** Marks a scope whose lists have already been backed by signals. */
const BOUND = Symbol('wdc-cube-solid:bound')

type Bound = { readonly refresh: () => void }

type ScopeInternals = Scope & {
    [BOUND]?: Bound
    [key: string | symbol]: unknown
}

/**
 * Lends a scope the `forceUpdate` a view answers, and makes its lists reactive.
 *
 * The observed fields are not this function's business: `solidObservedProperty`
 * instrumented them when their class was built, so `scope.title` is already a
 * signal read and changing it already wakes only what reads it.
 *
 * What is left is the one thing that instrumentation cannot reach. An
 * `ObservableArray` is not an `@observe()` field — it is a plain readonly one,
 * mutated in place, that reports by calling `scope.update` itself. There is no
 * assignment to intercept and the array's identity never changes, so the only
 * honest signal for it is one that says "something in here moved", refreshed
 * when the framework says the scope did. `<For>` keyed on identity is what
 * brings the granularity back at the row.
 */
export function bindScope<S extends Scope>(scope: S): S {
    const internals = scope as unknown as ScopeInternals
    const bound = internals[BOUND] ?? install(internals)

    // The scope outlives the view, so the view only lends it a `forceUpdate`.
    scope.forceUpdate = bound.refresh
    onCleanup(() => {
        if (scope.forceUpdate === bound.refresh) {
            scope.forceUpdate = NOOP_VOID
        }
    })

    return scope
}

function install(scope: ScopeInternals): Bound {
    const lists: Array<() => void> = []

    for (const key of Object.keys(scope)) {
        const list = scope[key]
        if (!(list instanceof ObservableArray)) {
            continue
        }

        // `equals: false` because the value handed back is the same object every
        // time; without it nothing downstream would ever see a mutation.
        const [value, setValue] = createSignal<unknown>(list, { equals: false })
        Object.defineProperty(scope, key, {
            configurable: true,
            enumerable: true,
            get: value,
            set: (next: unknown) => setValue(() => next)
        })
        lists.push(() => setValue(() => list))
    }

    // One Cube update, one Solid flush, however many lists moved inside it.
    const bound: Bound = { refresh: () => batch(() => lists.forEach((run) => run())) }

    Object.defineProperty(scope, BOUND, { value: bound, enumerable: false })
    return bound
}
