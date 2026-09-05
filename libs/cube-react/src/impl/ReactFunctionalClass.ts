/**
 * Copyright © 2025 WeDoCode Consultoria e Soluções Avançadas LTDA. All rights reserved.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import React from 'react'
import { Logger, NOOP_VOID, Scope } from 'wdc-cube'

/**
 * The scope type, read out of the props: `ScopeOf<{ scope: TodoScope }>` is
 * `TodoScope`. Props without a `scope` fall back to the base type.
 */
export type ScopeOf<P> = P extends { scope: infer S } ? S : Scope | undefined

export type FCClassContext<P> = {
    /**
     * Filled in by the framework before every `render`, mirroring `props.scope`.
     *
     * `implements` only checks a class, it never contributes members: a class
     * that uses `this.scope` has to declare it. To avoid repeating that
     * declaration, extend {@link FCClass}, which brings it already typed from
     * the props.
     */
    scope?: ScopeOf<P>

    onSyncState?: (props: P, initial: boolean) => void
    onAttach?: (props: P) => void
    onDetach?: (props: P) => void

    /** Called after every render, with the DOM already committed. */
    onAfterRender?: (props: P) => void

    render(props: P): React.ReactNode
}

/**
 * Optional base for views written as classes. Brings `scope` already declared
 * and typed from the props, so views do not redeclare it.
 *
 * A class that needs a different base can still use `implements
 * FCClassContext<P>` and declare `scope` by hand.
 */
export abstract class FCClass<P> implements FCClassContext<P> {
    scope!: ScopeOf<P>

    abstract render(props: P): React.ReactNode
}

// Internal state kept on the instance itself, under symbols, so it neither
// collides with the user's own fields nor costs extra hooks.
const Attrs = {
    initialized: Symbol('initialized'),
    forceUpdate: Symbol('forceUpdate'),
    boundScope: Symbol('boundScope')
}

const ZERO_DEPS: React.DependencyList = []

const INCREMENT = (value: number) => value + 1

const LOG = Logger.get('React.FCClass')

export function classToFComponent<P>(ctor: new (props: P) => FCClassContext<P>, optReact?: typeof React): React.FC<P> {
    const react = optReact ?? React

    // Decided once per class rather than on every render. The hook rules require
    // a stable sequence within ONE component; different components may call
    // different sets. Since `classToFComponent` produces one component per class,
    // and the class's shape is already known here, a class that does not declare
    // `onAfterRender` does not pay for an effect that runs after every render.
    const hasAfterRender = typeof ctor.prototype.onAfterRender === 'function'

    return (props: P) => {
        // useRef rather than useMemo: no factory closure allocated per render,
        // and a genuinely stable identity (useMemo may discard its value).
        const instanceRef = react.useRef<FCClassContext<P> | undefined>(undefined)
        if (instanceRef.current === undefined) {
            instanceRef.current = new ctor(props)
        }
        const memo = instanceRef.current
        const ctxRec = memo as unknown as Record<string | symbol, unknown>

        const [, setValue] = react.useState(0)

        if (ctxRec[Attrs.initialized] !== true) {
            if (!hasAfterRender && typeof memo.onAfterRender === 'function') {
                LOG.warn(
                    `${ctor.name}.onAfterRender was defined as an instance field and will be ignored. ` +
                        'Declare it as a class method so the framework can detect it.'
                )
            }

            // Created once: `setValue` is stable across renders, so a single
            // function serves for the component's whole lifetime.
            ctxRec[Attrs.forceUpdate] = () => setValue(INCREMENT)

            memo.onSyncState?.(props, true)
            ctxRec[Attrs.initialized] = true
        } else {
            memo.onSyncState?.(props, false)
        }

        const scope = props_getScope(props)
        memo.scope = scope as ScopeOf<P>
        // Internal copy: `memo.scope` is public and the user's class can reassign
        // it, which would make cleanup release the wrong scope — and a scope
        // released by mistake stops redrawing.
        ctxRec[Attrs.boundScope] = scope
        if (scope) {
            // A plain assignment: the old per-render `.bind` existed only to carry
            // the counter read from that render. With the functional form of
            // setValue, one function serves for the component's whole lifetime.
            scope.forceUpdate = ctxRec[Attrs.forceUpdate] as () => void
        }

        // Always called: a conditional useEffect would change the hook count
        // between renders as soon as props.scope went from undefined to defined.
        react.useEffect(() => {
            memo.onAttach?.(props)
            return () => {
                static_unbindUpdate(ctxRec[Attrs.boundScope] as Scope | undefined)
                memo.onDetach?.(props)
            }
        }, ZERO_DEPS)

        if (hasAfterRender) {
            // Deliberately without a dependency list: runs after every render.
            react.useEffect(() => {
                memo.onAfterRender?.(props)
            })
        }

        return memo.render(props)
    }
}

function props_getScope(props: unknown) {
    const propsRec = props as unknown as Record<string, unknown>
    if (propsRec.scope instanceof Scope) {
        return propsRec.scope
    }
}

function static_unbindUpdate(scope: Scope | undefined) {
    if (scope) {
        scope.forceUpdate = NOOP_VOID
    }
}
