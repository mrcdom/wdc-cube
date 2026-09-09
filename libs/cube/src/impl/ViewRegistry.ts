/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import type { Scope, ScopeConstructor } from './Scope.js'

export type ViewRegistry<V> = {
    /** Pairs a scope class with the view that draws it. */
    register(scopeCtor: ScopeConstructor, view: V): void

    /** The view registered for this scope's class, if any. */
    get(scope?: Scope | null): V | undefined
}

/**
 * Builds the scope-to-view lookup that a binding package needs.
 *
 * The view constructor is stored on the scope's *class*, under a symbol, so
 * resolution is a property read rather than a map lookup, and nothing has to be
 * kept in sync as scopes come and go.
 *
 * Each binding package creates its own registry. They deliberately do not share
 * one: the symbol is what keeps a React registration from overwriting an Angular
 * one, so the same scope classes can be paired with a different view per
 * technology — which is the point of keeping presenters free of the view.
 */
export function createViewRegistry<V>(name: string): ViewRegistry<V> {
    const VIEW_SYMBOL = Symbol(name)

    return {
        register(scopeCtor: ScopeConstructor, view: V): void {
            const dynScopeCtor = scopeCtor as unknown as Record<string | symbol, unknown>
            dynScopeCtor[VIEW_SYMBOL] = view
        },

        get(scope?: Scope | null): V | undefined {
            if (scope && scope.constructor) {
                const dynScopeCtor = scope.constructor as unknown as Record<string | symbol, unknown>
                return dynScopeCtor[VIEW_SYMBOL] as V | undefined
            }
            return undefined
        }
    }
}
