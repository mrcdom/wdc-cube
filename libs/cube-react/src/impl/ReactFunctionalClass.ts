/**
 * Copyright © 2025 WeDoCode Consultoria e Soluções Avançadas LTDA. All rights reserved.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import React from 'react'
import { Logger, NOOP_VOID, Scope } from 'wdc-cube'

/**
 * Tipo do escopo, derivado das props: `ScopeOf<{ scope: TodoScope }>` e `TodoScope`.
 * Props sem `scope` caem no tipo base.
 */
export type ScopeOf<P> = P extends { scope: infer S } ? S : Scope | undefined

export type FCClassContext<P> = {
    /**
     * Preenchido pelo framework antes de cada `render`, espelhando `props.scope`.
     *
     * `implements` apenas verifica, nao injeta membros: uma classe que use
     * `this.scope` precisa declara-lo. Para nao repetir a declaracao, estenda
     * {@link FCClass}, que ja a traz — e com o tipo certo, derivado das props.
     */
    scope?: ScopeOf<P>

    onSyncState?: (props: P, initial: boolean) => void
    onAttach?: (props: P) => void
    onDetach?: (props: P) => void

    /** Chamado depois de cada render, com o DOM ja atualizado. */
    onAfterRender?: (props: P) => void

    render(props: P): React.ReactNode
}

// Estado interno guardado na propria instancia, sob simbolos, para nao colidir
// com campos do usuario nem custar hooks adicionais.
/**
 * Base opcional para views escritas como classe. Traz `scope` ja declarado e
 * tipado a partir das props, dispensando a declaracao em cada view.
 *
 * Quem precisar de outra classe base continua podendo usar `implements
 * FCClassContext<P>` e declarar `scope` a mao.
 */
export abstract class FCClass<P> implements FCClassContext<P> {
    scope!: ScopeOf<P>

    abstract render(props: P): React.ReactNode
}

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

    // Decidido uma vez por classe, e nao a cada render. As regras de hooks exigem
    // que a sequencia seja estavel dentro de UM componente; componentes distintos
    // podem chamar conjuntos distintos. Como `classToFComponent` produz um
    // componente por classe, e a forma da classe ja esta definida aqui, quem nao
    // declara `onAfterRender` nao paga por um efeito que roda a cada render.
    const hasAfterRender = typeof ctor.prototype.onAfterRender === 'function'

    return (props: P) => {
        // useRef em vez de useMemo: nao aloca a closure da fabrica a cada render
        // e da identidade estavel de fato (useMemo pode descartar o valor).
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
                    `${ctor.name}.onAfterRender foi definido como campo de instancia e sera ignorado. ` +
                        'Declare-o como metodo da classe para que o framework o detecte.'
                )
            }

            // Criada uma unica vez: `setValue` e estavel entre renders, entao
            // uma unica funcao serve para toda a vida do componente.
            ctxRec[Attrs.forceUpdate] = () => setValue(INCREMENT)

            memo.onSyncState?.(props, true)
            ctxRec[Attrs.initialized] = true
        } else {
            memo.onSyncState?.(props, false)
        }

        const scope = props_getScope(props)
        memo.scope = scope as ScopeOf<P>
        // Copia interna: `memo.scope` e publico e a classe do usuario pode
        // reatribui-lo, o que faria a limpeza desligar o escopo errado —
        // e um escopo desligado por engano para de redesenhar.
        ctxRec[Attrs.boundScope] = scope
        if (scope) {
            // Atribuicao simples: o antigo `.bind` por render existia so porque
            // o contador era lido do render corrente. Com a forma funcional de
            // setValue, uma unica funcao serve para toda a vida do componente.
            scope.forceUpdate = ctxRec[Attrs.forceUpdate] as () => void
        }

        // Sempre chamado: um useEffect condicional mudaria a contagem de hooks
        // entre renders assim que props.scope saisse de indefinido para definido.
        react.useEffect(() => {
            memo.onAttach?.(props)
            return () => {
                static_unbindUpdate(ctxRec[Attrs.boundScope] as Scope | undefined)
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
