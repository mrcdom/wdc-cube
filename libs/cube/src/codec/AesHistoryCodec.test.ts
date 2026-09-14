import { describe, expect, it } from 'vitest'

import { createHistoryCodec } from './AesHistoryCodec.js'

/** A demo key. Real ones are derived per user, on a server. */
const key = new Uint8Array(32).fill(7)

const codec = createHistoryCodec(key)

describe('the reference codec', () => {
    it('comes back the way it went in', () => {
        const query = 'state=todo&priority=high&page=2'
        expect(codec.decode(codec.encode(query)!)).toBe(query)
    })

    it('gives the same state the same address, every time', () => {
        // The stability requirement: copying an address twice has to give the
        // same string. It is what AES-SIV buys and a random nonce would not.
        const query = 'state=todo&page=2'
        expect(codec.encode(query)).toBe(codec.encode(query))
    })

    it('hides what it carries', () => {
        const envelope = codec.encode('cpf=12345678901')!
        expect(envelope).not.toContain('cpf')
        expect(envelope).not.toContain('12345678901')
    })

    it('refuses an address sealed with another key', () => {
        const other = createHistoryCodec(new Uint8Array(32).fill(9))
        expect(other.decode(codec.encode('state=todo')!)).toBeUndefined()
    })

    it('refuses an address that was altered', () => {
        const envelope = codec.encode('state=todo&page=2')!
        const tampered = envelope.slice(0, -2) + (envelope.endsWith('A') ? 'BB' : 'AA')
        expect(codec.decode(tampered)).toBeUndefined()
    })

    it('refuses a payload that is not an envelope at all', () => {
        expect(codec.decode('not-base64url!!')).toBeUndefined()
        expect(codec.decode('')).toBeUndefined()
    })

    it('produces a payload the framework can carry as one parameter', () => {
        // The contract `HistoryCodec.encode` states: an `&` in here would be
        // read as the start of a second parameter, and `_e=a&b` is ambiguous.
        const envelope = codec.encode('state=todo&priority=high&page=2')!
        expect(envelope).toMatch(/^[A-Za-z0-9_-]+$/)
    })

    it('leaves short addresses uncompressed, because deflate would grow them', () => {
        // `page=2` deflates from 6 bytes to 8. The flag says what was done.
        const short = fromBase64Url(codec.encode('page=2')!)
        expect(short[1] & 1).toBe(0)
    })

    it('compresses when compressing actually helps', () => {
        const repetitive = 'tag=' + 'alpha,'.repeat(80)
        const long = fromBase64Url(codec.encode(repetitive)!)
        expect(long[1] & 1).toBe(1)
        expect(codec.decode(codec.encode(repetitive)!)).toBe(repetitive)
    })

    it('costs less than the address it replaces is worth', () => {
        const query = 'state=todo&priority=high&assignee=m2&sort=-updatedAt&page=3'
        const envelope = codec.encode(query)!
        // 18 bytes of envelope plus base64url's third. Far from the 2000 an
        // address can safely carry.
        expect(envelope.length).toBeLessThan(200)
    })
})

describe('rotating the key', () => {
    const v1 = new Uint8Array(32).fill(1)
    const v2 = new Uint8Array(32).fill(2)

    const before = createHistoryCodec(v1)
    const after = createHistoryCodec({
        current: { version: 2, key: v2 },
        previous: [{ version: 1, key: v1 }]
    })

    it('opens an address sealed under the previous key', () => {
        const old = before.encode('state=todo&page=2')!
        expect(after.decode(old)).toBe('state=todo&page=2')
    })

    it('seals new addresses under the current key only', () => {
        const fresh = after.encode('state=todo&page=2')!
        expect(before.decode(fresh)).toBeUndefined()
        // Which is also how a link migrates: the reader's own history is
        // rewritten the next time the application publishes that address.
        expect(fromBase64Url(fresh)[0]).toBe(2)
    })

    it('refuses a version it no longer offers', () => {
        // The grace period for v1 has closed.
        const narrowed = createHistoryCodec({ current: { version: 2, key: v2 } })
        expect(narrowed.decode(before.encode('state=todo')!)).toBeUndefined()
    })

    it('refuses a version it has never heard of', () => {
        const future = createHistoryCodec({ current: { version: 3, key: v2 } })
        expect(after.decode(future.encode('state=todo')!)).toBeUndefined()
    })

    it('keeps the single-key form meaning version 1', () => {
        // What every application written against the first release passes, and
        // what makes this change additive.
        expect(fromBase64Url(before.encode('state=todo')!)[0]).toBe(1)
    })

    it('refuses to offer one version twice', () => {
        expect(() =>
            createHistoryCodec({
                current: { version: 1, key: v2 },
                previous: [{ version: 1, key: v1 }]
            })
        ).toThrowError(/offered twice/)
    })

    it('refuses a version that will not fit in the byte', () => {
        expect(() => createHistoryCodec({ current: { version: 0, key: v1 } })).toThrowError(/1 to 255/)
        expect(() => createHistoryCodec({ current: { version: 256, key: v1 } })).toThrowError(/1 to 255/)
    })
})

describe('the key, as it actually arrives', () => {
    it('accepts the 43 base64url characters a server sends', () => {
        // The shape of `GET /auth/history_key`: 32 bytes, base64url, unpadded.
        const text = 'WuTd8whtLEICGY9w-KN0rNK-Y-o-ozw5ojAOCzU1crU'
        expect(text).toHaveLength(43)

        const fromText = createHistoryCodec(text)
        const fromBytes = createHistoryCodec(fromBase64Url(text))

        // The same key either way, which is the point: nobody should have to
        // write the decoder, and reaching for `atob` gets `-_` wrong.
        expect(fromText.encode('state=todo')).toBe(fromBytes.encode('state=todo'))
    })

    it('says what is wrong with a key of the wrong length', () => {
        expect(() => createHistoryCodec(new Uint8Array(16))).toThrowError(/32 bytes; received 16/)
        expect(() => createHistoryCodec('c2hvcnQ')).toThrowError(/32 bytes; received 5/)
    })
})

function fromBase64Url(payload: string): Uint8Array {
    const binary = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index++) {
        bytes[index] = binary.charCodeAt(index)
    }
    return bytes
}
