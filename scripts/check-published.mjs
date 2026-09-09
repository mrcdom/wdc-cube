/**
 * Refuses to call a release finished until the registry agrees.
 *
 * `pnpm publish -r` reported success for six packages while two of them were
 * not on the registry, and the workflow went green. It had happened once
 * before. Both times the answer was propagation — the versions did arrive —
 * but a release that cannot tell "arrived late" from "never arrived" is a
 * release nobody can read.
 *
 * So this asks, and keeps asking. The delay is real and measured in minutes,
 * which is why this retries rather than failing on the first miss.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { argv, exit, stdout } from 'node:process'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const ATTEMPTS = Number(argv[2] ?? 10)
const WAIT_MS = Number(argv[3] ?? 15_000)

const expected = readdirSync(join(root, 'libs'))
    .map((name) => JSON.parse(readFileSync(join(root, 'libs', name, 'package.json'), 'utf8')))
    .filter((manifest) => !manifest.private)
    .map((manifest) => ({ name: manifest.name, version: manifest.version }))

const missingFrom = async (list) => {
    const missing = []
    for (const { name, version } of list) {
        const response = await fetch(`https://registry.npmjs.org/${name}`, { cache: 'no-store' })
        if (!response.ok) {
            missing.push({ name, version, why: `registry answered ${response.status}` })
            continue
        }
        const document = await response.json()
        if (!Object.hasOwn(document.versions, version)) {
            missing.push({ name, version, why: `latest is ${document['dist-tags'].latest}` })
        }
    }
    return missing
}

let missing = expected
for (let attempt = 1; attempt <= ATTEMPTS && missing.length > 0; attempt++) {
    missing = await missingFrom(missing)
    if (missing.length === 0) {
        break
    }
    stdout.write(`waiting for ${missing.map((m) => m.name).join(', ')} (${attempt}/${ATTEMPTS})\n`)
    if (attempt < ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, WAIT_MS))
    }
}

if (missing.length > 0) {
    stdout.write('\nPublished nothing the registry will admit to:\n\n')
    for (const { name, version, why } of missing) {
        stdout.write(`  ${name}@${version} — ${why}\n`)
    }
    stdout.write('\n')
    exit(1)
}

for (const { name, version } of expected) {
    stdout.write(`  ${name}@${version}\n`)
}
