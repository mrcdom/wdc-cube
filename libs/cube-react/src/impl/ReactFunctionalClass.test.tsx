import React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Logger, Scope } from 'wdc-cube'

import { classToFComponent, FCClass, type FCClassContext } from './ReactFunctionalClass'

class SampleScope extends Scope {
    label = 'inicial'
}

let container: HTMLDivElement
let root: Root

beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
})

afterEach(() => {
    React.act(() => root.unmount())
    container.remove()
})

function render(element: React.ReactNode) {
    React.act(() => root.render(element))
}

describe('FCClass', () => {
    type Props = { scope: SampleScope }

    it('traz scope declarado e tipado a partir das props, sem repeticao na view', () => {
        class Sample extends FCClass<Props> {
            // nenhuma declaracao de `scope` aqui: vem da base
            private texto() {
                // tipado como SampleScope: `label` so existe nele
                return this.scope.label.toUpperCase()
            }
            render() {
                return <span>{this.texto()}</span>
            }
        }

        // P inferido: sem parametro de tipo explicito
        const View = classToFComponent(Sample)
        const scope = new SampleScope()

        render(<View scope={scope} />)
        expect(container.textContent).toBe('INICIAL')

        scope.label = 'trocado'
        React.act(() => scope.forceUpdate())
        expect(container.textContent).toBe('TROCADO')
    })
})

describe('classToFComponent', () => {
    it('permite que render devolva null', () => {
        type Props = { visivel: boolean }

        class Sample implements FCClassContext<Props> {
            render({ visivel }: Props) {
                return visivel ? <span>conteudo</span> : null
            }
        }

        const View = classToFComponent(Sample)

        render(<View visivel={true} />)
        expect(container.textContent).toBe('conteudo')

        render(<View visivel={false} />)
        expect(container.textContent).toBe('')
    })

    it('atribui props.scope na instancia antes do render', () => {
        type Props = { scope: SampleScope }

        class Sample implements FCClassContext<Props> {
            scope!: SampleScope

            // le de this.scope, sem que o render tenha atribuido nada
            private texto() {
                return this.scope.label
            }

            render() {
                return <span>{this.texto()}</span>
            }
        }

        const View = classToFComponent<Props>(Sample)
        const scope = new SampleScope()

        render(<View scope={scope} />)
        expect(container.textContent).toBe('inicial')
    })

    it('liga scope.forceUpdate para redesenhar a partir do escopo', () => {
        type Props = { scope: SampleScope }

        class Sample implements FCClassContext<Props> {
            scope!: SampleScope
            render() {
                return <span>{this.scope.label}</span>
            }
        }

        const View = classToFComponent<Props>(Sample)
        const scope = new SampleScope()

        render(<View scope={scope} />)
        expect(container.textContent).toBe('inicial')

        scope.label = 'alterado'
        React.act(() => scope.forceUpdate())
        expect(container.textContent).toBe('alterado')
    })

    it('desliga forceUpdate ao desmontar', () => {
        type Props = { scope: SampleScope }

        class Sample implements FCClassContext<Props> {
            scope!: SampleScope
            render() {
                return <span>{this.scope.label}</span>
            }
        }

        const View = classToFComponent<Props>(Sample)
        const scope = new SampleScope()

        render(<View scope={scope} />)
        const ligado = scope.forceUpdate

        render(<div />)
        expect(scope.forceUpdate).not.toBe(ligado)
    })

    it('desliga o escopo corrente quando props.scope mudou depois da montagem', () => {
        type Props = { scope: SampleScope }

        class Sample implements FCClassContext<Props> {
            scope!: SampleScope
            render() {
                return <span>{this.scope.label}</span>
            }
        }

        const View = classToFComponent<Props>(Sample)
        const primeiro = new SampleScope()
        const segundo = new SampleScope()

        render(<View scope={primeiro} />)
        render(<View scope={segundo} />)
        const ligadoNoSegundo = segundo.forceUpdate

        render(<div />)
        expect(segundo.forceUpdate).not.toBe(ligadoNoSegundo)
    })

    it('nao se deixa enganar por uma classe que reatribui this.scope', () => {
        type Props = { scope: SampleScope }
        const intruso = new SampleScope()
        const ligadoNoIntruso = intruso.forceUpdate

        class Sample implements FCClassContext<Props> {
            scope!: SampleScope
            render() {
                const texto = this.scope.label
                // uso indevido: sobrescreve o campo que o framework preencheu
                this.scope = intruso
                return <span>{texto}</span>
            }
        }

        const View = classToFComponent<Props>(Sample)
        const real = new SampleScope()

        render(<View scope={real} />)
        const ligadoNoReal = real.forceUpdate
        render(<div />)

        // o escopo de verdade foi desligado...
        expect(real.forceUpdate).not.toBe(ligadoNoReal)
        // ...e o intruso, que nunca foi ligado, ficou intacto
        expect(intruso.forceUpdate).toBe(ligadoNoIntruso)
    })

    it('sobrevive a props.scope indo de indefinido para definido', () => {
        // Regressao: com o useEffect dentro de um if, a contagem de hooks mudava
        // entre estes dois renders e o React lancava
        // "Rendered more hooks than during the previous render".
        type Props = { scope?: SampleScope }

        class Sample implements FCClassContext<Props> {
            render({ scope }: Props) {
                return <span>{scope ? scope.label : 'sem escopo'}</span>
            }
        }

        const View = classToFComponent(Sample)

        render(<View />)
        expect(container.textContent).toBe('sem escopo')

        render(<View scope={new SampleScope()} />)
        expect(container.textContent).toBe('inicial')
    })

    it('chama onSyncState com initial=true so no primeiro render', () => {
        type Props = { n: number }
        const chamadas: boolean[] = []

        class Sample implements FCClassContext<Props> {
            onSyncState(_props: Props, initial: boolean) {
                chamadas.push(initial)
            }
            render({ n }: Props) {
                return <span>{n}</span>
            }
        }

        const View = classToFComponent(Sample)

        render(<View n={1} />)
        render(<View n={2} />)

        expect(chamadas).toEqual([true, false])
    })

    it('chama onAfterRender depois de cada render, com o DOM pronto', () => {
        type Props = { texto: string }
        const vistos: string[] = []

        class Sample implements FCClassContext<Props> {
            onAfterRender() {
                // le do DOM: prova que roda depois da commit
                vistos.push(container.textContent ?? '')
            }
            render({ texto }: Props) {
                return <span>{texto}</span>
            }
        }

        const View = classToFComponent<Props>(Sample)

        render(<View texto="um" />)
        render(<View texto="dois" />)

        expect(vistos).toEqual(['um', 'dois'])
    })

    it('nao registra o efeito pos-render em classes que nao declaram onAfterRender', () => {
        // Conta os useEffect atraves do React injetado por optReact
        function contarEfeitos() {
            let chamadas = 0
            const espiao = {
                ...React,
                useEffect: (...args: Parameters<typeof React.useEffect>) => {
                    chamadas++
                    return React.useEffect(...args)
                }
            } as unknown as typeof React
            return {
                espiao,
                get chamadas() {
                    return chamadas
                }
            }
        }

        class Sem implements FCClassContext<Record<string, never>> {
            render() {
                return <span>sem</span>
            }
        }

        class Com implements FCClassContext<Record<string, never>> {
            onAfterRender() {
                // NOOP
            }
            render() {
                return <span>com</span>
            }
        }

        const sem = contarEfeitos()
        const ViewSem = classToFComponent<Record<string, never>>(Sem, sem.espiao)
        render(<ViewSem />)
        render(<ViewSem />)

        const com = contarEfeitos()
        const ViewCom = classToFComponent<Record<string, never>>(Com, com.espiao)
        render(<ViewCom />)
        render(<ViewCom />)

        // 2 renders: sem onAfterRender paga 1 efeito por render; com, paga 2
        expect(sem.chamadas).toBe(2)
        expect(com.chamadas).toBe(4)
    })

    it('avisa quando onAfterRender e campo de instancia, em vez de ignorar em silencio', () => {
        // O Logger faz bind de console.warn ao ser criado, entao trocar
        // console.warn depois nao teria efeito: troca-se o metodo do logger.
        const avisos: string[] = []
        const log = Logger.get('React.FCClass')
        const originalWarn = log.warn
        log.warn = (...args: unknown[]) => avisos.push(args.join(' '))

        try {
            class Sample implements FCClassContext<Record<string, never>> {
                // definido como campo: nao aparece no prototype
                onAfterRender = () => undefined
                render() {
                    return <span>x</span>
                }
            }

            const View = classToFComponent<Record<string, never>>(Sample)
            render(<View />)
        } finally {
            log.warn = originalWarn
        }

        expect(avisos.join(' ')).toContain('onAfterRender')
    })

    it('chama onAttach na montagem e onDetach na desmontagem', () => {
        const eventos: string[] = []

        class Sample implements FCClassContext<Record<string, never>> {
            onAttach() {
                eventos.push('attach')
            }
            onDetach() {
                eventos.push('detach')
            }
            render() {
                return <span>x</span>
            }
        }

        const View = classToFComponent(Sample)

        render(<View />)
        expect(eventos).toEqual(['attach'])

        render(<div />)
        expect(eventos).toEqual(['attach', 'detach'])
    })
})
