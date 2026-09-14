import { describe, expect, it } from 'vitest'
import { TestHistoryManager } from 'wdc-cube-test'
import { createHistoryCodec } from 'wdc-cube-tutorial-presentation/codec'

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

describe('the codec on a TestHistoryManager', () => {
    it('keeps assertions readable while hiding what travelled', () => {
        const manager = new TestHistoryManager()
        manager.codec = codec

        const place = { name: 'todos' } as never
        const app = { newFlipIntent: () => ({ toString: () => 'todos?state=todo' }) } as never
        manager.update(app, place)

        expect(manager.token).toBe('todos?state=todo')
        expect(manager.encodedToken).toContain('todos?_e=')
        expect(manager.encodedToken).not.toContain('state=todo')
        expect(manager.location).toBe('todos?state=todo')
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
