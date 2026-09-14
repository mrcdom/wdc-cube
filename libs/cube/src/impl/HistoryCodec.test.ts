import { describe, expect, it } from 'vitest'

import { HistoryManager } from './HistoryManager.js'
import type { HistoryCodec } from './HistoryCodec.js'

/**
 * The seam, exercised through a subclass because the helpers are protected —
 * which is what they should be: a codec is installed on a `HistoryManager`, and
 * nothing outside one has any business encoding a query.
 */
class Probe extends HistoryManager {
    public encode(query: string): string {
        return this.encodeQuery(query)
    }

    public decode(query: string): string {
        return this.decodeQuery(query)
    }
}

const toBase64Url = (text: string) =>
    Buffer.from(text, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const fromBase64Url = (payload: string) => Buffer.from(payload, 'base64url').toString('utf8')

/**
 * Reverses the string and writes it as base64url.
 *
 * Deterministic, and enough to prove a round trip. The base64url is not
 * decoration: the interface requires a payload safe as a parameter value, and a
 * raw `&` in there would be read as the start of a second parameter.
 */
const reversing: HistoryCodec = {
    envelope: '_e',
    encode: (query) => toBase64Url([...query].reverse().join('')),
    decode: (payload) => [...fromBase64Url(payload)].reverse().join('')
}

describe('HistoryManager without a codec', () => {
    it('hands the query straight back', () => {
        const probe = new Probe()
        expect(probe.encode('state=todo&page=2')).toBe('state=todo&page=2')
        expect(probe.decode('state=todo&page=2')).toBe('state=todo&page=2')
    })
})

describe('HistoryManager with a codec', () => {
    it('wraps the whole query in one named parameter', () => {
        const probe = new Probe()
        probe.codec = reversing
        expect(probe.encode('state=todo')).toBe(`_e=${toBase64Url('odot=etats')}`)
    })

    it('comes back the way it went in', () => {
        const probe = new Probe()
        probe.codec = reversing
        const query = 'state=todo&priority=high&page=2'
        expect(probe.decode(probe.encode(query))).toBe(query)
    })

    it('leaves an address that carries no envelope alone', () => {
        const probe = new Probe()
        probe.codec = reversing
        // A bookmark saved before the codec existed, which has to keep opening.
        expect(probe.decode('state=todo&page=2')).toBe('state=todo&page=2')
    })

    it('does not mistake a parameter that merely sits next to the envelope', () => {
        const probe = new Probe()
        probe.codec = reversing
        expect(probe.decode('_e=abc&page=2')).toBe('_e=abc&page=2')
    })

    it('opens in the default state when the payload cannot be read', () => {
        const probe = new Probe()
        probe.codec = { ...reversing, decode: () => undefined }
        expect(probe.decode('_e=whatever')).toBe('')
    })

    it('publishes plain text when the codec declines', () => {
        const probe = new Probe()
        probe.codec = { ...reversing, encode: () => undefined }
        expect(probe.encode('state=todo')).toBe('state=todo')
    })

    it('has nothing to do with an empty query', () => {
        const probe = new Probe()
        probe.codec = reversing
        expect(probe.encode('')).toBe('')
        expect(probe.decode('')).toBe('')
    })
})

describe('a codec that is not deterministic', () => {
    /**
     * The case the seam exists for. A real AEAD with a random nonce produces a
     * different envelope for the same state every time; this does the same with
     * a counter, which is easier to assert against.
     */
    let counter = 0
    const shifting: HistoryCodec = {
        envelope: '_e',
        encode: (query) => toBase64Url(`${counter++}.${query}`),
        decode: (payload) => {
            const text = fromBase64Url(payload)
            return text.slice(text.indexOf('.') + 1)
        }
    }

    it('still round trips, twice, to different envelopes', () => {
        const probe = new Probe()
        probe.codec = shifting

        const query = 'state=todo&page=2'
        const first = probe.encode(query)
        const second = probe.encode(query)

        expect(first).not.toBe(second)
        expect(probe.decode(first)).toBe(query)
        expect(probe.decode(second)).toBe(query)
    })

    it('is why the framework compares plain text', () => {
        const probe = new Probe()
        probe.codec = shifting

        const query = 'state=todo&page=2'
        // Envelope against envelope says "it changed" when nothing did, which is
        // a history entry per scope update and, on the read side, a navigation
        // loop. Plain against plain says what is true.
        expect(probe.encode(query)).not.toBe(probe.encode(query))
        expect(probe.decode(probe.encode(query))).toBe(probe.decode(probe.encode(query)))
    })
})
