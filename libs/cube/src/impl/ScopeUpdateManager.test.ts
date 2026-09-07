import { describe, expect, it } from 'vitest'

import { ScopeUpdateManager } from './Presenter'
import { Scope } from './Scope'

class RootScope extends Scope {}
class ChildScope extends Scope {}

function trackRedraws(scope: Scope) {
    const calls = { count: 0 }
    scope.forceUpdate = () => calls.count++
    return calls
}

describe('ScopeUpdateManager', () => {
    it('notifies a nested scope even when a base update is already pending', () => {
        // A base update used to discard the dirty set, on the assumption that
        // redrawing the root redraws everything under it. React works that way;
        // a view technology that only refreshes what it was told about does not,
        // and the nested view would silently keep stale content.
        const root = new RootScope()
        const child = new ChildScope()
        const manager = new ScopeUpdateManager(root)

        const rootRedraws = trackRedraws(root)
        const childRedraws = trackRedraws(child)

        manager.update() // base update: the presenter's own scope
        manager.update(child) // nested scope changes in the same flush
        manager.emitBeforeScopeUpdate()

        expect(rootRedraws.count).toBe(1)
        expect(childRedraws.count).toBe(1)
    })

    it('notifies a nested scope when the base update comes second', () => {
        const root = new RootScope()
        const child = new ChildScope()
        const manager = new ScopeUpdateManager(root)

        const rootRedraws = trackRedraws(root)
        const childRedraws = trackRedraws(child)

        manager.update(child)
        manager.update()
        manager.emitBeforeScopeUpdate()

        expect(rootRedraws.count).toBe(1)
        expect(childRedraws.count).toBe(1)
    })

    it('redraws only the nested scope when no base update was requested', () => {
        const root = new RootScope()
        const child = new ChildScope()
        const manager = new ScopeUpdateManager(root)

        const rootRedraws = trackRedraws(root)
        const childRedraws = trackRedraws(child)

        manager.update(child)
        manager.emitBeforeScopeUpdate()

        expect(rootRedraws.count).toBe(0)
        expect(childRedraws.count).toBe(1)
    })

    it('clears what it flushed, so a second flush redraws nothing', () => {
        const root = new RootScope()
        const child = new ChildScope()
        const manager = new ScopeUpdateManager(root)

        const rootRedraws = trackRedraws(root)
        const childRedraws = trackRedraws(child)

        manager.update()
        manager.update(child)
        manager.emitBeforeScopeUpdate()
        manager.emitBeforeScopeUpdate()

        expect(rootRedraws.count).toBe(1)
        expect(childRedraws.count).toBe(1)
    })
})
