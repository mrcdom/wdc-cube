// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'

import { PageHistoryManager } from './PageHistoryManager.js'
import type { HistoryCodec } from './HistoryCodec.js'

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
