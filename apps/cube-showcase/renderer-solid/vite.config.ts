import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

export default defineConfig(({ mode }) => ({
    plugins: [solid()],
    // GitHub Pages serves a project site under `/<repo>/`; the dev server and
    // anywhere else serve it at the root. So the base is an input rather than a
    // constant, and a fork under another name needs no edit here.
    base: process.env.PUBLIC_BASE_PATH ?? '/',
    // wdc-cube's Logger enables debug/info when NODE_ENV === 'development'.
    define: { 'process.env.NODE_ENV': JSON.stringify(mode) },
    server: { port: 3004, open: true },
    build: { outDir: 'build', sourcemap: true }
}))
