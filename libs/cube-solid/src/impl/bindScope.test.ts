import { createEffect, createRoot } from 'solid-js'
import { Observable, ObservableArray, observe, Scope } from 'wdc-cube'
import { beforeAll, describe, expect, it } from 'vitest'

import { bindScope } from './bindScope'
import { useSolidScopes } from './instrumentation'

// Before any scope exists, which is the contract the core enforces.
beforeAll(() => useSolidScopes())

@Observable
class PersonScope extends Scope {
    @observe() name = 'ana'
    @observe() age = 30
}

@Observable
class ListScope extends Scope {
    @observe() title = 'todos'
    readonly items = new ObservableArray<PersonScope>(this)
}

/** Runs `body` in a reactive owner, as a view's lifetime would. */
function inRoot(body: () => void): void {
    createRoot(() => body())
}

describe('the instrumentation', () => {
    it('re-runs only the expressions that read the field that moved', () => {
        const scope = new PersonScope()
        const runs = { name: 0, age: 0 }
        const seen = { name: '', age: 0 }

        inRoot(() => {
            createEffect(() => {
                seen.name = scope.name
                runs.name++
            })
            createEffect(() => {
                seen.age = scope.age
                runs.age++
            })
        })

        expect(runs).toEqual({ name: 1, age: 1 })

        scope.name = 'bruno'
        // The whole claim: one field moved, one expression re-ran. A signal per
        // scope would have made both of these 2.
        expect(runs).toEqual({ name: 2, age: 1 })

        scope.age = 31
        expect(runs).toEqual({ name: 2, age: 2 })
        expect(seen).toEqual({ name: 'bruno', age: 31 })
    })

    it('needs no binding call: the field is a signal from the moment it exists', () => {
        const scope = new PersonScope()
        let seen = ''

        // No bindScope here. Instrumentation happened when the class was built.
        inRoot(() => createEffect(() => (seen = scope.name)))

        scope.name = 'bruno'
        expect(seen).toBe('bruno')
    })

    it('does not re-run when a field is assigned the value it already had', () => {
        const scope = new PersonScope()
        let runs = 0

        let seen = ''
        inRoot(() =>
            createEffect(() => {
                seen = scope.name
                runs++
            })
        )

        scope.name = 'ana'
        expect(runs).toBe(1)
        expect(seen).toBe('ana')
    })

    it('leaves the framework its own notification, unchanged', () => {
        const scope = new PersonScope()
        let updates = 0
        scope.update = () => updates++

        scope.name = 'bruno'
        expect(updates).toBe(1)
        expect(scope.name).toBe('bruno')

        // The comparison that decides whether a write counts is still the core's.
        scope.name = 'bruno'
        expect(updates).toBe(1)
    })

    it('gives each scope its own signals', () => {
        const one = new PersonScope()
        const other = new PersonScope()
        const runs = { one: 0, other: 0 }
        const seen = { one: '', other: '' }

        inRoot(() => {
            createEffect(() => {
                seen.one = one.name
                runs.one++
            })
            createEffect(() => {
                seen.other = other.name
                runs.other++
            })
        })

        one.name = 'bruno'
        expect(runs).toEqual({ one: 2, other: 1 })
        expect(seen).toEqual({ one: 'bruno', other: 'ana' })
    })

    it('refuses to be replaced once a scope has been built', () => {
        expect(() => useSolidScopes()).toThrowError(/before the first scope is constructed/)
    })
})

describe('bindScope', () => {
    it('reacts to a list mutated in place, which has no assignment to intercept', () => {
        const scope = new ListScope()
        const runs = { items: 0, title: 0 }
        const seen = { items: 0, title: '' }

        inRoot(() => {
            bindScope(scope)
            createEffect(() => {
                seen.items = scope.items.length
                runs.items++
            })
            createEffect(() => {
                seen.title = scope.title
                runs.title++
            })
        })

        expect(runs).toEqual({ items: 1, title: 1 })

        // ObservableArray reports by calling `scope.update`, which reaches
        // `forceUpdate` through the presenter. There is no presenter here, so
        // the test stands in for one.
        scope.items.push(new PersonScope())
        scope.forceUpdate()

        expect(scope.items.length).toBe(1)
        expect(seen.items).toBe(1)
        expect(runs.items).toBe(2)
        // The title did not move, and was left alone.
        expect(runs.title).toBe(1)
    })

    it('hands the scope back its own forceUpdate when the view goes away', () => {
        const scope = new ListScope()
        let dispose!: () => void

        createRoot((d) => {
            dispose = d
            bindScope(scope)
        })

        const lent = scope.forceUpdate
        dispose()
        expect(scope.forceUpdate).not.toBe(lent)
    })
})
