import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

export default defineConfig(({ mode }) => ({
    plugins: [solid()],
    // wdc-cube's Logger enables debug/info when NODE_ENV === 'development'.
    define: { 'process.env.NODE_ENV': JSON.stringify(mode) },
    server: { port: 3003, open: true },
    build: { outDir: 'build', sourcemap: true }
}))
