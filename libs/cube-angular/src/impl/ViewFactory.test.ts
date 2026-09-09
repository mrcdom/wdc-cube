import { describe, expect, it } from 'vitest'
import { Scope } from 'wdc-cube'

import { ViewFactory } from './ViewFactory.js'

class AlphaScope extends Scope {}
class BetaScope extends Scope {}

class AlphaView {}
class BetaView {}

describe('ViewFactory', () => {
    it('resolves a scope instance to the view registered for its class', () => {
        ViewFactory.register(AlphaScope, AlphaView)
        ViewFactory.register(BetaScope, BetaView)

        expect(ViewFactory.get(new AlphaScope())).toBe(AlphaView)
        expect(ViewFactory.get(new BetaScope())).toBe(BetaView)
    })

    it('returns undefined for an unregistered scope, and for none at all', () => {
        class UnknownScope extends Scope {}

        expect(ViewFactory.get(new UnknownScope())).toBeUndefined()
        expect(ViewFactory.get(undefined)).toBeUndefined()
        expect(ViewFactory.get(null)).toBeUndefined()
    })
})
