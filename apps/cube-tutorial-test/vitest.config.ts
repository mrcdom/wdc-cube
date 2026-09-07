import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        // No jsdom: the presentation layer never touches a document. Needing one
        // here would mean something had leaked across the view boundary.
        environment: 'node',
        setupFiles: ['./vitest.setup.ts'],
        include: ['src/**/*.test.ts']
    }
})
