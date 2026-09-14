import { describe, expect, it } from 'vitest'
import type { HistoryCodec } from 'wdc-cube'

import { TestHistoryManager } from './TestHistoryManager.js'

const toBase64Url = (text: string) =>
    Buffer.from(text, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const fromBase64Url = (payload: string) => Buffer.from(payload, 'base64url').toString('utf8')

/** Reverses the query and writes it as base64url, which is payload-safe. */
const reversing: HistoryCodec = {
    envelope: '_e',
    encode: (query) => toBase64Url([...query].reverse().join('')),
    decode: (payload) => [...fromBase64Url(payload)].reverse().join('')
}

/** What a flip publishes, without needing an application to make one. */
function publish(manager: TestHistoryManager, token: string): void {
    const place = { name: token.split('?')[0] } as never
    const app = { newFlipIntent: () => ({ toString: () => token }) } as never
    manager.update(app, place)
}

describe('TestHistoryManager without a codec', () => {
    it('reads back what was published', () => {
        const manager = new TestHistoryManager()
        publish(manager, 'todos?state=todo')

        expect(manager.location).toBe('todos?state=todo')
        expect(manager.token).toBe('todos?state=todo')
        expect(manager.encodedToken).toBe('todos?state=todo')
    })
})

describe('TestHistoryManager with a codec', () => {
    it('keeps the token plain so an assertion stays readable', () => {
        const manager = new TestHistoryManager()
        manager.codec = reversing
        publish(manager, 'todos?state=todo')

        expect(manager.token).toBe('todos?state=todo')
    })

    it('exposes what actually travelled', () => {
        const manager = new TestHistoryManager()
        manager.codec = reversing
        publish(manager, 'todos?state=todo')

        expect(manager.encodedToken).toBe(`todos?_e=${toBase64Url('odot=etats')}`)
        // The claim a codec makes, and the only one worth asserting.
        expect(manager.encodedToken).not.toContain('state=todo')
    })

    it('leaves the place legible', () => {
        const manager = new TestHistoryManager()
        manager.codec = reversing
        publish(manager, 'todos/detail?issue=7')

        expect(manager.encodedToken.startsWith('todos/detail?')).toBe(true)
    })

    it('reads an encoded address back as plain', () => {
        const manager = new TestHistoryManager()
        manager.codec = reversing
        manager.location = `todos?_e=${toBase64Url('odot=etats')}`

        // A test reproducing a shared link.
        expect(manager.location).toBe('todos?state=todo')
    })

    it('reads a plain address back unchanged', () => {
        const manager = new TestHistoryManager()
        manager.codec = reversing
        manager.location = 'todos?state=todo'

        // A test reproducing a bookmark older than the codec.
        expect(manager.location).toBe('todos?state=todo')
    })

    it('has nothing to encode in a token without a query', () => {
        const manager = new TestHistoryManager()
        manager.codec = reversing
        publish(manager, 'todos')

        expect(manager.encodedToken).toBe('todos')
        expect(manager.location).toBe('todos')
    })

    it('records one token per change, not one per flip', () => {
        let n = 0
        const manager = new TestHistoryManager()
        manager.codec = {
            envelope: '_e',
            encode: (query) => toBase64Url(`${n++}.${query}`),
            decode: (payload) => {
                const text = fromBase64Url(payload)
                return text.slice(text.indexOf('.') + 1)
            }
        }

        publish(manager, 'todos?state=todo')
        publish(manager, 'todos?state=todo')
        publish(manager, 'todos?state=done')

        // Comparing envelopes would have recorded three: the codec never
        // repeats one. Comparing the plain form records what moved.
        expect(manager.tokens).toEqual(['todos?state=todo', 'todos?state=done'])
        expect(manager.encodedTokens).toHaveLength(2)
    })

    it('forgets both forms when told to', () => {
        const manager = new TestHistoryManager()
        manager.codec = reversing
        publish(manager, 'todos?state=todo')
        manager.clearTokens()

        expect(manager.tokens).toEqual([])
        expect(manager.encodedTokens).toEqual([])
    })
})
