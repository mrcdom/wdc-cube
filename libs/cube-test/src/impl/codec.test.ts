import { describe, expect, it } from 'vitest'
import { createHistoryCodec } from 'wdc-cube/codec'

import { TestHistoryManager } from './TestHistoryManager.js'

/**
 * The reference codec against the test manager, rather than the toy one used in
 * `TestHistoryManager.test.ts`.
 *
 * That file proves the seam with something whose output can be written out by
 * hand. This one proves the thing an application will actually install: a real
 * AEAD, whose envelope nobody can predict, still leaves a test readable.
 */
const codec = createHistoryCodec(new Uint8Array(32).fill(7))

describe('the reference codec on a TestHistoryManager', () => {
    it('keeps assertions readable while hiding what travelled', () => {
        const manager = new TestHistoryManager()
        manager.codec = codec

        const place = { name: 'todos' } as never
        const app = { newFlipIntent: () => ({ toString: () => 'todos?state=todo' }) } as never
        manager.update(app, place)

        // What the test is about: where the application went.
        expect(manager.token).toBe('todos?state=todo')
        expect(manager.location).toBe('todos?state=todo')

        // And what actually travelled, which is the codec's only claim.
        expect(manager.encodedToken).toContain('todos?_e=')
        expect(manager.encodedToken).not.toContain('state=todo')
    })

    it('starts the application from an address somebody sealed earlier', () => {
        const manager = new TestHistoryManager()
        manager.codec = codec

        // A shared link, as an application would read it while kick-starting.
        manager.location = 'todos?state=todo&page=2'
        expect(manager.location).toBe('todos?state=todo&page=2')
    })
})
