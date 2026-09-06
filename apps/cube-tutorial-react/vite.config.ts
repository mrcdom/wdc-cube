import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => ({
    plugins: [react()],
    // wdc-cube's Logger enables debug/info when NODE_ENV === 'development'.
    // Without this, `process` does not exist in the browser and both stay off.
    define: {
        'process.env.NODE_ENV': JSON.stringify(mode)
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src/scripts', import.meta.url))
        }
    },
    server: {
        port: 3000,
        open: true
    },
    build: {
        outDir: 'build',
        sourcemap: true
    }
}))
