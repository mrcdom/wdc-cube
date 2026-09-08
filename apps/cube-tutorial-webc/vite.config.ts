import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
    // wdc-cube's Logger enables debug/info when NODE_ENV === 'development'.
    define: { 'process.env.NODE_ENV': JSON.stringify(mode) },
    resolve: { alias: { '@': fileURLToPath(new URL('./src/scripts', import.meta.url)) } },
    server: { port: 3003, open: true },
    build: { outDir: 'build', sourcemap: true }
}))
