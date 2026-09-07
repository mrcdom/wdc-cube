import { ChangeDetectorRef, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { NOOP_VOID, Scope } from 'wdc-cube'

import { bindScope } from './bindScope'

class SampleScope extends Scope {
    label = 'initial'
}

/**
 * bindScope takes any Signal, not only a component input, so its logic can be
 * exercised in a plain injection context. Compiling a real component would need
 * the Angular compiler, which the app's build provides and this package's does
 * not; the slot directive is covered there instead.
 */
let redraws: number

function bind(scope: ReturnType<typeof signal<Scope | undefined | null>>) {
    TestBed.runInInjectionContext(() => bindScope(scope))
    TestBed.tick()
}

beforeEach(() => {
    redraws = 0
    TestBed.configureTestingModule({
        providers: [{ provide: ChangeDetectorRef, useValue: { markForCheck: () => redraws++ } }]
    })
})

afterEach(() => TestBed.resetTestingModule())

describe('bindScope', () => {
    it('routes forceUpdate to the change detector', () => {
        const scope = new SampleScope()
        bind(signal<Scope | undefined | null>(scope))

        expect(redraws).toBe(0)
        scope.forceUpdate()
        expect(redraws).toBe(1)
    })

    it('releases the previous scope when the signal changes', () => {
        const first = new SampleScope()
        const second = new SampleScope()
        const current = signal<Scope | undefined | null>(first)

        bind(current)
        expect(first.forceUpdate).not.toBe(NOOP_VOID)

        current.set(second)
        TestBed.tick()

        expect(first.forceUpdate).toBe(NOOP_VOID)
        expect(second.forceUpdate).not.toBe(NOOP_VOID)
    })

    it('binds nothing for a nullish scope', () => {
        const current = signal<Scope | undefined | null>(undefined)
        bind(current)

        const scope = new SampleScope()
        current.set(scope)
        TestBed.tick()

        scope.forceUpdate()
        expect(redraws).toBe(1)
    })

    it('releases the scope when the injection context is destroyed', () => {
        const scope = new SampleScope()
        bind(signal<Scope | undefined | null>(scope))
        expect(scope.forceUpdate).not.toBe(NOOP_VOID)

        TestBed.resetTestingModule()
        expect(scope.forceUpdate).toBe(NOOP_VOID)
    })

    it('does not release a scope another binding has since taken over', () => {
        const scope = new SampleScope()
        const current = signal<Scope | undefined | null>(scope)

        bind(current)
        const firstBinding = scope.forceUpdate

        // a second component binds the same scope and wins the slot
        const takenOver = () => undefined
        scope.forceUpdate = takenOver

        current.set(undefined)
        TestBed.tick()

        expect(scope.forceUpdate).toBe(takenOver)
        expect(scope.forceUpdate).not.toBe(firstBinding)
    })
})
