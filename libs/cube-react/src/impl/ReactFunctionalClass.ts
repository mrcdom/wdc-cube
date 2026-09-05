/**
 * Copyright © 2025 WeDoCode Consultoria e Soluções Avançadas LTDA. All rights reserved.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import React, { JSX } from 'react'
import { NOOP_VOID, Scope } from 'wdc-cube'

export type FCClassContext<P> = {
    onSyncState?: (props: P, initial: boolean) => void
    onAttach?: (props: P) => void
    onDetach?: (props: P) => void
    render(props: P): JSX.Element
}

const Attrs = {
    initialized: Symbol('initialized')
}

const ZERO_DEPS: React.DependencyList = []

export function classToFComponent<P>(ctor: new (props: P) => FCClassContext<P>, optReact?: typeof React): React.FC<P> {
    const react = optReact ?? React
    const memoFactory = (props: P) => new ctor(props)
    return (props: P) => {
        const memo = react.useMemo(() => memoFactory(props), ZERO_DEPS)
        const [value, setValue] = react.useState(0)

        const ctxRec = memo as unknown as Record<string | symbol, unknown>
        if (ctxRec[Attrs.initialized] !== true) {
            memo.onSyncState?.(props, true)
            ctxRec[Attrs.initialized] = true
        } else {
            memo.onSyncState?.(props, false)
        }

        const scope = props_getScope(props)
        if (scope || memo.onAttach || memo.onDetach) {
            static_bindUpdate(scope, setValue, value)
            react.useEffect(() => {
                static_bindUpdate(scope, setValue, value)
                memo.onAttach?.(props)
                return () => {
                    static_unbindUpdate(scope)
                    memo.onDetach?.(props)
                }
            }, ZERO_DEPS)
        }

        return memo.render(props)
    }
}

type NumValueSetter = React.Dispatch<React.SetStateAction<number>>

function props_getScope(props: unknown) {
    const propsRec = props as unknown as Record<string, unknown>
    if (propsRec.scope instanceof Scope) {
        return propsRec.scope
    }
}

function static_bindUpdate(scope: Scope | undefined, setValue: NumValueSetter, value: number) {
    if (scope) {
        scope.forceUpdate = scope_forceUpdate.bind(scope, setValue, value)
    }
}

function static_unbindUpdate(scope: Scope | undefined) {
    if (scope) {
        scope.forceUpdate = NOOP_VOID
    }
}

function scope_forceUpdate(this: Scope, setValue: NumValueSetter, value: number) {
    setValue(value + 1)
}
