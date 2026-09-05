import React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Logger, Scope } from 'wdc-cube'

import { classToFComponent, FCClass, type FCClassContext } from './ReactFunctionalClass'

class SampleScope extends Scope {
    label = 'initial'
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

    it('brings scope declared and typed from the props, with no repetition in the view', () => {
        class Sample extends FCClass<Props> {
            // no `scope` declaration here: it comes from the base
            private text() {
                // typed as SampleScope: `label` only exists there
                return this.scope.label.toUpperCase()
            }
            render() {
                return <span>{this.text()}</span>
            }
        }

        // P inferred: no explicit type argument
        const View = classToFComponent(Sample)
        const scope = new SampleScope()

        render(<View scope={scope} />)
        expect(container.textContent).toBe('INITIAL')

        scope.label = 'swapped'
        React.act(() => scope.forceUpdate())
        expect(container.textContent).toBe('SWAPPED')
    })
})

describe('classToFComponent', () => {
    it('lets render return null', () => {
        type Props = { visible: boolean }

        class Sample implements FCClassContext<Props> {
            render({ visible }: Props) {
                return visible ? <span>content</span> : null
            }
        }

        const View = classToFComponent(Sample)

        render(<View visible={true} />)
        expect(container.textContent).toBe('content')

        render(<View visible={false} />)
        expect(container.textContent).toBe('')
    })

    it('assigns props.scope onto the instance before render', () => {
        type Props = { scope: SampleScope }

        class Sample implements FCClassContext<Props> {
            scope!: SampleScope

            // reads from this.scope, without render having assigned anything
            private text() {
                return this.scope.label
            }

            render() {
                return <span>{this.text()}</span>
            }
        }

        const View = classToFComponent<Props>(Sample)
        const scope = new SampleScope()

        render(<View scope={scope} />)
        expect(container.textContent).toBe('initial')
    })

    it('binds scope.forceUpdate so the scope can drive a redraw', () => {
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
        expect(container.textContent).toBe('initial')

        scope.label = 'changed'
        React.act(() => scope.forceUpdate())
        expect(container.textContent).toBe('changed')
    })

    it('releases forceUpdate on unmount', () => {
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
        const bound = scope.forceUpdate

        render(<div />)
        expect(scope.forceUpdate).not.toBe(bound)
    })

    it('releases the current scope when props.scope changed after mounting', () => {
        type Props = { scope: SampleScope }

        class Sample implements FCClassContext<Props> {
            scope!: SampleScope
            render() {
                return <span>{this.scope.label}</span>
            }
        }

        const View = classToFComponent<Props>(Sample)
        const first = new SampleScope()
        const second = new SampleScope()

        render(<View scope={first} />)
        render(<View scope={second} />)
        const boundOnSecond = second.forceUpdate

        render(<div />)
        expect(second.forceUpdate).not.toBe(boundOnSecond)
    })

    it('is not misdirected by a class that reassigns this.scope', () => {
        type Props = { scope: SampleScope }
        const impostor = new SampleScope()
        const boundOnImpostor = impostor.forceUpdate

        class Sample implements FCClassContext<Props> {
            scope!: SampleScope
            render() {
                const text = this.scope.label
                // misuse: overwrites the field the framework filled in
                this.scope = impostor
                return <span>{text}</span>
            }
        }

        const View = classToFComponent<Props>(Sample)
        const real = new SampleScope()

        render(<View scope={real} />)
        const boundOnReal = real.forceUpdate
        render(<div />)

        // the real scope was released...
        expect(real.forceUpdate).not.toBe(boundOnReal)
        // ...and the impostor, never bound, was left untouched
        expect(impostor.forceUpdate).toBe(boundOnImpostor)
    })

    it('survives props.scope going from undefined to defined', () => {
        // Regression: with useEffect inside an if, the hook count changed between
        // these two renders and React threw
        // "Rendered more hooks than during the previous render".
        type Props = { scope?: SampleScope }

        class Sample implements FCClassContext<Props> {
            render({ scope }: Props) {
                return <span>{scope ? scope.label : 'no scope'}</span>
            }
        }

        const View = classToFComponent(Sample)

        render(<View />)
        expect(container.textContent).toBe('no scope')

        render(<View scope={new SampleScope()} />)
        expect(container.textContent).toBe('initial')
    })

    it('calls onSyncState with initial=true only on the first render', () => {
        type Props = { n: number }
        const calls: boolean[] = []

        class Sample implements FCClassContext<Props> {
            onSyncState(_props: Props, initial: boolean) {
                calls.push(initial)
            }
            render({ n }: Props) {
                return <span>{n}</span>
            }
        }

        const View = classToFComponent(Sample)

        render(<View n={1} />)
        render(<View n={2} />)

        expect(calls).toEqual([true, false])
    })

    it('calls onAfterRender after every render, with the DOM committed', () => {
        type Props = { text: string }
        const seen: string[] = []

        class Sample implements FCClassContext<Props> {
            onAfterRender() {
                // reads the DOM: proves it runs after the commit
                seen.push(container.textContent ?? '')
            }
            render({ text }: Props) {
                return <span>{text}</span>
            }
        }

        const View = classToFComponent<Props>(Sample)

        render(<View text="one" />)
        render(<View text="two" />)

        expect(seen).toEqual(['one', 'two'])
    })

    it('does not register the after-render effect for classes without onAfterRender', () => {
        // Counts useEffect calls through the React injected via optReact
        function countEffects() {
            let calls = 0
            const spy = {
                ...React,
                useEffect: (...args: Parameters<typeof React.useEffect>) => {
                    calls++
                    return React.useEffect(...args)
                }
            } as unknown as typeof React
            return {
                spy,
                get calls() {
                    return calls
                }
            }
        }

        class Without implements FCClassContext<Record<string, never>> {
            render() {
                return <span>without</span>
            }
        }

        class With_ implements FCClassContext<Record<string, never>> {
            onAfterRender() {
                // NOOP
            }
            render() {
                return <span>with</span>
            }
        }

        const without = countEffects()
        const ViewWithout = classToFComponent<Record<string, never>>(Without, without.spy)
        render(<ViewWithout />)
        render(<ViewWithout />)

        const with_ = countEffects()
        const ViewWith = classToFComponent<Record<string, never>>(With_, with_.spy)
        render(<ViewWith />)
        render(<ViewWith />)

        // 2 renders: without onAfterRender costs 1 effect per render; with it, 2
        expect(without.calls).toBe(2)
        expect(with_.calls).toBe(4)
    })

    it('warns when onAfterRender is an instance field, instead of ignoring it silently', () => {
        // The Logger binds console.warn when it is created, so replacing
        // console.warn afterwards would have no effect: swap the logger's method.
        const warnings: string[] = []
        const log = Logger.get('React.FCClass')
        const originalWarn = log.warn
        log.warn = (...args: unknown[]) => warnings.push(args.join(' '))

        try {
            class Sample implements FCClassContext<Record<string, never>> {
                // defined as a field: does not appear on the prototype
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

        expect(warnings.join(' ')).toContain('onAfterRender')
    })

    it('calls onAttach on mount and onDetach on unmount', () => {
        const events: string[] = []

        class Sample implements FCClassContext<Record<string, never>> {
            onAttach() {
                events.push('attach')
            }
            onDetach() {
                events.push('detach')
            }
            render() {
                return <span>x</span>
            }
        }

        const View = classToFComponent(Sample)

        render(<View />)
        expect(events).toEqual(['attach'])

        render(<div />)
        expect(events).toEqual(['attach', 'detach'])
    })
})
