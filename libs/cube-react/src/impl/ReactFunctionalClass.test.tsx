import React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Scope } from 'wdc-cube'

import { classToFComponent, type FCClassContext } from './ReactFunctionalClass'

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
