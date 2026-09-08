import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.ts'],
        include: ['src/**/*.test.ts'],
        css: {
            // Real class names instead of hashes, so a test can say what it
            // means: `li.completed`, not `li._completed_1sfo2_196`.
            modules: { classNameStrategy: 'non-scoped' }
        }
    }
})
