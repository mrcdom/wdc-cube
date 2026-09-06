import { describe, expect, it } from 'vitest'

import { Scope } from './Scope'
import { createViewRegistry } from './ViewRegistry'

class SampleScope extends Scope {}

describe('createViewRegistry', () => {
    it('resolves a scope instance to the view registered for its class', () => {
        const registry = createViewRegistry<string>('test:one')
        registry.register(SampleScope, 'the-view')

        expect(registry.get(new SampleScope())).toBe('the-view')
    })

    it('keeps registries independent, so one technology cannot overwrite another', () => {
        // This is why each binding package creates its own registry rather than
        // sharing one: the same scope class must be able to carry a React view
        // and an Angular view at once.
        const react = createViewRegistry<string>('test:react')
        const angular = createViewRegistry<string>('test:angular')

        react.register(SampleScope, 'react-view')
        angular.register(SampleScope, 'angular-view')

        const scope = new SampleScope()
        expect(react.get(scope)).toBe('react-view')
        expect(angular.get(scope)).toBe('angular-view')
    })

    it('returns undefined for an unregistered scope, and for none at all', () => {
        const registry = createViewRegistry<string>('test:empty')

        expect(registry.get(new SampleScope())).toBeUndefined()
        expect(registry.get(undefined)).toBeUndefined()
        expect(registry.get(null)).toBeUndefined()
    })
})
