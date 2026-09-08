import solid from 'vite-plugin-solid'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    plugins: [solid()],
    // Solid ships a browser build and a server build; the tests exercise the one
    // that runs in a page, which is what a view uses.
    resolve: { conditions: ['browser', 'development'] },
    test: {
        environment: 'jsdom',
        include: ['src/**/*.test.tsx', 'src/**/*.test.ts']
    }
})
