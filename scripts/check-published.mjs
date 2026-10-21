/**
 * Refuses to call a release finished until the registry agrees.
 *
 * `pnpm publish -r` reported success for six packages while two of them were
 * not on the registry, and the workflow went green. It had happened once
 * before. So this asks, and keeps asking.
 *
 * ## The window, and why it is this long
 *
 * The first version of this waited two and a half minutes, which was written
 * from a guess rather than a measurement. On 1.4.0 the last package took
 * **thirteen minutes** to become visible, so the release went red while being
 * perfectly intact — and a red that means "probably fine, look it up by hand"
 * is worse than no check, because the next red means nothing either.
 *
 * The budget is twenty minutes now, with the interval backing off so a fast
 * propagation is still confirmed in seconds.
 *
 * ## Three different failures, which the first version called one
 *
 * - **The package is not on the registry at all.** A name that never existed:
 *   a typo, or a new package whose first publish needs a human because trusted
 *   publishing has nothing to attach to yet. Waiting will not fix it.
 * - **The package is there and the version is not.** Propagation, until the
 *   budget says otherwise.
 * - **The version is there and `latest` still points at the old one.** The
 *   half-release that is easiest to miss: the tarball exists, and everyone
 *   running `npm install` keeps getting the previous version.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { argv, exit, stdout } from 'node:process'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const BUDGET_MS = Number(argv[2] ?? 20 * 60_000)
const FIRST_WAIT_MS = Number(argv[3] ?? 10_000)
const MAX_WAIT_MS = Number(argv[4] ?? 60_000)

const expected = readdirSync(join(root, 'libs'))
    .map((name) => JSON.parse(readFileSync(join(root, 'libs', name, 'package.json'), 'utf8')))
    .filter((manifest) => !manifest.private)
    .map((manifest) => ({ name: manifest.name, version: manifest.version }))

/** `absent`, `unpublished` and `stale-tag` are three different conversations. */
async function look({ name, version }) {
    const response = await fetch(`https://registry.npmjs.org/${name}`, { cache: 'no-store' })

    if (response.status === 404) {
        return { state: 'absent', why: 'no such package on the registry' }
    }
    if (!response.ok) {
        return { state: 'unreachable', why: `registry answered ${response.status}` }
    }

    const document = await response.json()
    const latest = document['dist-tags']?.latest

    if (!Object.hasOwn(document.versions ?? {}, version)) {
        return { state: 'unpublished', why: `not on the registry; latest is ${latest}` }
    }
    if (latest !== version) {
        return { state: 'stale-tag', why: `published, but latest still points at ${latest}` }
    }
    return { state: 'published' }
}

const started = Date.now()
const elapsed = () => Math.round((Date.now() - started) / 1000)

let pending = expected.map((pkg) => ({ ...pkg }))
const arrived = []
let wait = FIRST_WAIT_MS

while (pending.length > 0) {
    const stillPending = []
    for (const pkg of pending) {
        const seen = await look(pkg)
        if (seen.state === 'published') {
            arrived.push({ ...pkg, after: elapsed() })
        } else {
            stillPending.push({ ...pkg, ...seen })
        }
    }
    pending = stillPending

    if (pending.length === 0) {
        break
    }

    // A name that does not exist will not start existing, and the budget spent
    // waiting for it is budget not spent telling somebody.
    if (pending.every((pkg) => pkg.state === 'absent')) {
        break
    }

    if (Date.now() - started + wait > BUDGET_MS) {
        break
    }

    stdout.write(`waiting ${elapsed()}s for ${pending.map((p) => p.name).join(', ')}\n`)
    await new Promise((resolve) => setTimeout(resolve, wait))
    wait = Math.min(wait * 2, MAX_WAIT_MS)
}

for (const { name, version, after } of arrived.sort((a, b) => a.after - b.after)) {
    stdout.write(`  ${name}@${version} — visible after ${after}s\n`)
}

if (pending.length > 0) {
    stdout.write(`\nThe registry does not have this release after ${elapsed()}s:\n\n`)
    for (const { name, version, why } of pending) {
        stdout.write(`  ${name}@${version} — ${why}\n`)
    }

    const absent = pending.filter((pkg) => pkg.state === 'absent')
    if (absent.length > 0) {
        stdout.write(
            '\nA package the registry has never heard of is not a propagation delay.\n' +
                'A first publish cannot come from this workflow: trusted publishing is\n' +
                'configured per package, and there is nothing to configure it on until the\n' +
                'package exists. Publish it once by hand, then name this workflow under\n' +
                'Trusted Publisher on npmjs.com.\n'
        )
    }

    const stale = pending.filter((pkg) => pkg.state === 'stale-tag')
    if (stale.length > 0) {
        stdout.write(
            '\nA version that exists while `latest` points elsewhere installs for nobody.\n' +
                'Check `npm dist-tag ls` for those packages.\n'
        )
    }

    stdout.write('\n')
    exit(1)
}
