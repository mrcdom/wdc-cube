/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import { createMemo, Show, type Component, type JSX } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { createViewRegistry, Logger, type Scope, type ScopeConstructor } from 'wdc-cube'

import { bindScope } from './bindScope'

const LOG = Logger.get('Solid.ViewFactory')

/** What every view is handed, and the only thing it is handed. */
export type ViewProps<S extends Scope = Scope> = { scope: S }

export type ViewComponent<S extends Scope = Scope> = Component<ViewProps<S>>

const registry = createViewRegistry<ViewComponent>('wdc-cube-solid:view')

export const ViewFactory = {
    /** Pairs a scope class with the component that draws it. */
    register<S extends Scope>(scopeCtor: ScopeConstructor, view: ViewComponent<S>): void {
        registry.register(scopeCtor, view as ViewComponent)
    },

    /** The component registered for this scope's class, if any. */
    viewFor(scope?: Scope | null): ViewComponent | undefined {
        return registry.get(scope)
    }
}

/**
 * Draws whichever view matches the scope currently in a slot.
 *
 * The slot binds the scope on the way in, which is what lets a view be written
 * as if `props.scope` were plain data: it reads `props.scope.title` and Solid
 * subscribes to that field alone. No view in the application mentions a signal.
 */
export function ViewSlot(props: { scope?: Scope | null; fallback?: JSX.Element }): JSX.Element {
    const current = createMemo(() => {
        const scope = props.scope
        if (!scope) {
            return undefined
        }

        const component = ViewFactory.viewFor(scope)
        if (!component) {
            LOG.error(`No view registered for scope ${scope.constructor.name}`)
            return undefined
        }

        return { component, scope: bindScope(scope) }
    })

    return (
        <Show when={current()} fallback={props.fallback} keyed>
            {(view) => <Dynamic component={view.component} scope={view.scope} />}
        </Show>
    )
}
