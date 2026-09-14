import { defineConfig } from 'vitest/config'

/**
 * Only the codec. The showcase is a demonstration, and its presenters are meant
 * to be read and changed freely rather than pinned down by assertions — but the
 * codec is cryptography somebody will copy into a real application, and copyable
 * cryptography that nothing checks is the wrong thing to ship.
 */
export default defineConfig({
    test: {
        environment: 'node',
        include: ['src/codec/**/*.test.ts']
    }
})
