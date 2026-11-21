import { afterEach, describe, expect, it, vi } from 'vitest'

import { Logger } from './Logger.js'

afterEach(() => {
    vi.restoreAllMocks()
})

describe('Logger.caught', () => {
    it('hands a thrown value that is not an Error over intact', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => void 0)
        const log = Logger.get('Logger.caught')
        log.setErrorEnabled(true) // binds the spy

        const thrown = { code: 'E42', detail: 'what went wrong' }
        log.caught(thrown)

        // Stringified, this used to arrive as "[object Object]" and say nothing.
        expect(error).toHaveBeenCalledTimes(1)
        expect(error.mock.calls[0]).toContain(thrown)
        expect(error.mock.calls[0]).not.toContain('[object Object]')
    })
})
