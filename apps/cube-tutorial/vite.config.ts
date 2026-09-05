import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => ({
    plugins: [react()],
    // O Logger do wdc-cube liga debug/info quando NODE_ENV === 'development'.
    // Sem isto, `process` nao existe no browser e os dois ficam desligados.
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
