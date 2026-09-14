// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'

import { PageHistoryManager } from './PageHistoryManager.js'
import type { HistoryCodec } from './HistoryCodec.js'
import type { Application } from './Application.js'
import type { Place } from './Place.js'

const toBase64Url = (text: string) =>
    Buffer.from(text, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const fromBase64Url = (payload: string) => Buffer.from(payload, 'base64url').toString('utf8')

const reversing: HistoryCodec = {
    envelope: '_e',
    encode: (query) => toBase64Url([...query].reverse().join('')),
    decode: (payload) => [...fromBase64Url(payload)].reverse().join('')
}
/**
 * The seam where it actually lives, rather than through a probe.
 *
 * `PageHistoryManager` is what encodes on the way out and decodes on the way
 * back, and what decides whether an address changed. These assert the two
 * failures the plan predicted for a non-deterministic codec: a history entry per
 * update, and `location` never agreeing with itself.
 */
describe('PageHistoryManager', () => {
    it('reads back plain text from an encoded address', () => {
        // The address is set first: `createBrowserHistory` reads the location
        // when it is built, and a later `replaceState` does not reach it.
        const encoded = toBase64Url([...'state=todo&page=2'].reverse().join(''))
        window.history.replaceState(null, '', `/todos?_e=${encoded}`)

        const manager = new PageHistoryManager()
        manager.codec = reversing

        expect(manager.location).toBe('/todos?state=todo&page=2')
    })

    it('reads back an address that was never encoded', () => {
        window.history.replaceState(null, '', '/todos?state=todo')

        const manager = new PageHistoryManager()
        manager.codec = reversing

        // A bookmark saved before the codec existed, which has to keep opening.
        expect(manager.location).toBe('/todos?state=todo')
    })

    it('agrees with itself under a codec that never repeats an envelope', () => {
        let n = 0
        const shifting: HistoryCodec = {
            envelope: '_e',
            encode: (query) => toBase64Url(`${n++}.${query}`),
            decode: (payload) => {
                const text = fromBase64Url(payload)
                return text.slice(text.indexOf('.') + 1)
            }
        }

        const first = shifting.encode('state=todo')!
        window.history.replaceState(null, '', `/todos?_e=${first}`)
        const once = new PageHistoryManager()
        once.codec = shifting
        const readFirst = once.location

        const second = shifting.encode('state=todo')!
        expect(second).not.toBe(first)
        window.history.replaceState(null, '', `/todos?_e=${second}`)
        const twice = new PageHistoryManager()
        twice.codec = shifting

        // Two different envelopes, one address. Comparing envelopes would call
        // these two different states and navigate in circles.
        expect(twice.location).toBe(readFirst)
        expect(twice.location).toBe('/todos?state=todo')
    })
})

/**
 * Turning a codec on and off while the application runs.
 *
 * Found in a browser rather than here, which is why it is here now: the switch
 * in the showcase changed nothing in the address, because the state had not
 * moved and that was all the comparison looked at.
 */
describe('PageHistoryManager when the codec changes under it', () => {
    const place = { name: '/todos' } as Place
    const app = {
        newFlipIntent: () => ({ getQueryString: () => 'state=todo' })
    } as unknown as Application

    /** `update` is debounced by 16ms; this is how a test gets past that. */
    function updateNow(manager: PageHistoryManager) {
        vi.useFakeTimers()
        try {
            manager.update(app, place)
            vi.advanceTimersByTime(20)
        } finally {
            vi.useRealTimers()
        }
    }

    it('republishes the address when a codec is installed', () => {
        window.history.replaceState(null, '', '/todos?state=todo')
        const manager = new PageHistoryManager()

        manager.codec = reversing
        updateNow(manager)

        // The state is the same state. What travels is not, and the address on
        // screen has to say so.
        expect(window.location.search).toBe(`?_e=${toBase64Url('odot=etats')}`)
        expect(manager.location).toBe('/todos?state=todo')
    })

    it('republishes the address when a codec is dropped', () => {
        window.history.replaceState(null, '', `/todos?_e=${toBase64Url('odot=etats')}`)
        const manager = new PageHistoryManager()
        manager.codec = reversing

        manager.codec = undefined
        updateNow(manager)

        expect(window.location.search).toBe('?state=todo')
    })

    it('still says nothing happened when neither the state nor the form moved', () => {
        window.history.replaceState(null, '', '/todos?state=todo')
        const manager = new PageHistoryManager()
        const before = window.history.length

        updateNow(manager)

        // The guard the whole comparison exists for: a scope update that
        // changes nothing must not push a history entry.
        expect(window.history.length).toBe(before)
    })
})
