/**
 * Refuses a build whose output Node cannot import.
 *
 * The libraries declare `type: module`, so what `tsc` emits is real ESM and
 * Node's resolver takes every specifier literally: no extension search, no
 * index lookup for a directory. `moduleResolution: "Bundler"` lets the *source*
 * omit the extension, and TypeScript does not add one on the way out — so
 * `export { Logger } from './impl/utils/Logger'` reaches npm exactly as
 * written, and `import 'wdc-cube'` throws ERR_MODULE_NOT_FOUND.
 *
 * That is how 1.2.0 was published. Every tarball had code in it, and none of it
 * could be imported outside a bundler. This is the check that was missing:
 * cheap, static, and specific to the mistake.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { exit, stderr } from 'node:process'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const bad = []

const walk = (dir) => {
    for (const name of readdirSync(dir)) {
        const path = join(dir, name)
        if (statSync(path).isDirectory()) {
            walk(path)
        } else if (name.endsWith('.js') || name.endsWith('.jsx')) {
            const source = readFileSync(path, 'utf8')
            for (const [, spec] of source.matchAll(/(?:from|import\()\s*['"](\.[^'"]*)['"]/g)) {
                if (!spec.endsWith('.js') && !spec.endsWith('.json')) {
                    bad.push(`${path.slice(root.length + 1)}  →  ${spec}`)
                }
            }
            // Preserved JSX is not JavaScript, whatever it is named.
            if (name.endsWith('.jsx')) {
                bad.push(`${path.slice(root.length + 1)}  →  emitted as JSX, which Node cannot parse`)
            }
        }
    }
}

for (const name of readdirSync(join(root, 'libs'))) {
    const lib = join(root, 'libs', name, 'lib')
    try {
        walk(lib)
    } catch {
        // Not every package emits: `wdc-cube-angular` ships its sources.
    }
}

if (bad.length > 0) {
    stderr.write(
        [
            '',
            'Emitted output that Node cannot import:',
            '',
            ...bad.map((line) => `  ${line}`),
            '',
            '  Relative specifiers need their extension. Write the import as',
            "  './x.js' in the TypeScript source — `tsc` copies specifiers",
            '  through untouched, and Node does not guess.',
            ''
        ].join('\n')
    )
    exit(1)
}
