/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import { createComponent, createMemo, Show, type Component, type JSX } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { createViewRegistry, Logger, type Scope, type ScopeConstructor } from 'wdc-cube'

import { bindScope } from './bindScope.js'

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
type Resolved = { component: ViewComponent; scope: Scope }

/**
 * The shape `Show` is being called with.
 *
 * `Show` is overloaded on `keyed`, and `createComponent` cannot pick an
 * overload through a props object made of getters. Stating the shape here is
 * the same contract the JSX version was compiled against — `keyed` is what
 * makes the view be built again when the scope in the slot changes, rather
 * than updated in place.
 */
type SlotProps = {
    when: Resolved | undefined
    keyed: true
    fallback?: JSX.Element
    children: (view: Resolved) => JSX.Element
}

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

    // Written with `createComponent` rather than as JSX, and the reason is
    // packaging. `tsc` with `jsx: preserve` emitted `ViewFactory.jsx` — JSX that
    // every consumer would then have to compile, with `jsxImportSource` set to
    // SolidJS, before it could even be imported. This file is the only one in
    // any of the six libraries that had a tag in it, for one component wrapping
    // another, so the tag went instead of the toolchain.
    //
    // The getters are not decoration. JSX compiles props on a component into
    // getters so that reading one subscribes to it; passing plain values here
    // would read them once and never again.
    return createComponent(Show as unknown as Component<SlotProps>, {
        get when() {
            return current()
        },
        get fallback() {
            return props.fallback
        },
        keyed: true,
        children: (view) =>
            createComponent(Dynamic, {
                get component() {
                    return view.component
                },
                get scope() {
                    return view.scope
                }
            })
    })
}
