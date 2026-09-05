/**
 * Copyright © 2025 WeDoCode Consultoria e Soluções Avançadas LTDA. All rights reserved.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import React from 'react'
import { Logger, NOOP_VOID, Scope } from 'wdc-cube'

export type FCClassContext<P> = {
    /**
     * Preenchido pelo framework antes de cada `render`, espelhando `props.scope`.
     * Declare-o com o tipo concreto do seu escopo para usá-lo nos demais métodos
     * da classe sem precisar receber `props` em todos eles.
     */
    scope?: Scope

    onSyncState?: (props: P, initial: boolean) => void
    onAttach?: (props: P) => void
    onDetach?: (props: P) => void

    /** Chamado depois de cada render, com o DOM ja atualizado. */
    onAfterRender?: (props: P) => void

    render(props: P): React.ReactNode
}

const Attrs = {
    initialized: Symbol('initialized')
}

const ZERO_DEPS: React.DependencyList = []

const LOG = Logger.get('React.FCClass')

export function classToFComponent<P>(ctor: new (props: P) => FCClassContext<P>, optReact?: typeof React): React.FC<P> {
    const react = optReact ?? React
    const memoFactory = (props: P) => new ctor(props)

    // Decidido uma vez por classe, e nao a cada render. As regras de hooks exigem
    // que a sequencia seja estavel dentro de UM componente; componentes distintos
    // podem chamar conjuntos distintos. Como `classToFComponent` produz um
    // componente por classe, e a forma da classe ja esta definida aqui, quem nao
    // declara `onAfterRender` nao paga por um efeito que roda a cada render.
    const hasAfterRender = typeof ctor.prototype.onAfterRender === 'function'

    return (props: P) => {
        const memo = react.useMemo(() => memoFactory(props), ZERO_DEPS)
        const [value, setValue] = react.useState(0)

        // Guarda o escopo corrente para que a limpeza desligue o certo, mesmo
        // que props.scope tenha mudado depois da montagem.
        const scopeRef = react.useRef<Scope | undefined>(undefined)

        const ctxRec = memo as unknown as Record<string | symbol, unknown>
        if (ctxRec[Attrs.initialized] !== true) {
            if (!hasAfterRender && typeof memo.onAfterRender === 'function') {
                LOG.warn(
                    `${ctor.name}.onAfterRender foi definido como campo de instancia e sera ignorado. ` +
                        'Declare-o como metodo da classe para que o framework o detecte.'
                )
            }
            memo.onSyncState?.(props, true)
            ctxRec[Attrs.initialized] = true
        } else {
            memo.onSyncState?.(props, false)
        }

        const scope = props_getScope(props)
        memo.scope = scope
        scopeRef.current = scope
        static_bindUpdate(scope, setValue, value)

        // Sempre chamado: um useEffect condicional mudaria a contagem de hooks
        // entre renders assim que props.scope saisse de indefinido para definido.
        react.useEffect(() => {
            memo.onAttach?.(props)
            return () => {
                static_unbindUpdate(scopeRef.current)
                memo.onDetach?.(props)
            }
        }, ZERO_DEPS)

        if (hasAfterRender) {
            // Sem lista de dependencias de proposito: roda apos cada render.
            react.useEffect(() => {
                memo.onAfterRender?.(props)
            })
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
