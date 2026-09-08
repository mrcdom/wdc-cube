import { defineConfig } from 'vitest/config'
import solid from 'vite-plugin-solid'

export default defineConfig({
    plugins: [solid()],
    // Solid ships a browser build and a server build; a view test exercises the
    // one that runs in a page.
    resolve: { conditions: ['browser', 'development'] },
    test: {
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.ts'],
        include: ['src/**/*.test.tsx'],
        css: {
            // Real class names instead of hashes, so a test can say what it
            // means: `li.completed`, not `li._completed_1sfo2_196`.
            modules: { classNameStrategy: 'non-scoped' }
        }
    }
})
