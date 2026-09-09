/**
 * Refuses a publish that is not pnpm's.
 *
 * The libraries depend on each other through `workspace:*`, which pnpm replaces
 * with the real version as it packs — verified: `wdc-cube-react`'s tarball
 * declares `wdc-cube: 1.2.0`. npm knows nothing about that protocol and would
 * publish the string as written, producing a package that cannot be installed
 * at all.
 *
 * `prepublishOnly` runs for `publish` and not for `pack`, which is what makes
 * this a guard on the irreversible step rather than a nuisance on the rest.
 */
import { env, exit } from 'node:process'

const agent = env.npm_config_user_agent ?? ''

if (!agent.startsWith('pnpm/')) {
    console.error(
        [
            '',
            'Refusing to publish: this must be run with pnpm.',
            '',
            `  The packager reported itself as: ${agent || '(nothing)'}`,
            '',
            '  These packages depend on each other through `workspace:*`. pnpm',
            '  rewrites that to the real version while packing; npm and yarn',
            '  publish it verbatim, and the result cannot be installed.',
            '',
            '  Use `pnpm publish -r` from the repository root.',
            ''
        ].join('\n')
    )
    exit(1)
}
