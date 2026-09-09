/**
 * Installs what would be published, into projects that are not this one.
 *
 * Everything in this repository resolves the libraries through the workspace:
 * the four Vite builds, the 234 tests, the showcase. That is why 1.2.0 shipped
 * six packages whose emitted imports Node could not follow, and 1.2.1 shipped an
 * Angular library the Angular compiler refuses to read — both were green here
 * and broken the moment anyone installed them.
 *
 * So this packs the six and installs the tarballs into scratch projects built
 * from scratch, with npm rather than pnpm, outside the workspace. Nothing is
 * linked; what is exercised is what would arrive.
 *
 * The consumers are generated rather than committed. Five app skeletons would
 * rot against every major of Angular, React and SolidJS; a generated one always
 * asks for the peer range the package itself declares.
 *
 *     node verify/run.mjs            every consumer
 *     node verify/run.mjs node       just one
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { argv, exit, stdout } from 'node:process'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const work = join(root, 'verify', '.work')
const packed = join(work, 'packages')

const run = (command, args, cwd) =>
    execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

const manifests = readdirSync(join(root, 'libs'))
    .map((name) => JSON.parse(readFileSync(join(root, 'libs', name, 'package.json'), 'utf8')))
    .filter((manifest) => !manifest.private)

/** A tarball for each library, built the way `publish` builds them. */
function packEverything() {
    mkdirSync(packed, { recursive: true })
    const files = {}
    for (const manifest of manifests) {
        run('pnpm', ['--filter', manifest.name, 'exec', 'pnpm', 'pack', '--pack-destination', packed], root)
        files[manifest.name] = join(packed, `${manifest.name}-${manifest.version}.tgz`)
    }
    return files
}

/** What a package says it needs from its host, so the consumer installs that. */
function peersOf(name, exclude = []) {
    const manifest = manifests.find((m) => m.name === name)
    return Object.entries(manifest.peerDependencies ?? {})
        .filter(([dependency]) => !dependency.startsWith('wdc-cube') && !exclude.includes(dependency))
        .map(([dependency, range]) => `${dependency}@${range}`)
}

function project(name, files) {
    const dir = join(work, name)
    rmSync(dir, { recursive: true, force: true })
    mkdirSync(dir, { recursive: true })
    for (const [path, contents] of Object.entries(files)) {
        mkdirSync(dirname(join(dir, path)), { recursive: true })
        writeFileSync(join(dir, path), contents)
    }
    return dir
}

/**
 * A bundler consumer: Vite builds it, and jsdom runs what Vite produced.
 *
 * Building alone is not enough. `wdc-cube-solid` emitted preserved JSX until
 * 1.2.1 — a file a bundler may or may not transform depending on how it is
 * configured, and which no amount of type checking notices. What settles it is
 * whether the thing draws.
 *
 * The bundle is written as a single IIFE so jsdom can simply run it: jsdom does
 * not load ES modules from a script tag.
 */
function bundled({ name, deps, files, plugin }) {
    const dir = project(name, {
        'package.json': JSON.stringify({ name: `verify-${name}`, private: true, type: 'module' }, null, 2),
        'index.html': `<!doctype html><html><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`,
        // What a consumer has to configure, and nothing more. Both of these are
        // requirements of the library rather than of this test: `@observe()`
        // is a legacy decorator, and a native class field would shadow the
        // accessor it installs.
        'tsconfig.json': JSON.stringify(
            {
                compilerOptions: {
                    target: 'ES2024',
                    module: 'ESNext',
                    moduleResolution: 'Bundler',
                    lib: ['ES2024', 'DOM', 'DOM.Iterable'],
                    experimentalDecorators: true,
                    useDefineForClassFields: false,
                    strict: true,
                    skipLibCheck: true,
                    ...(plugin?.tsconfig ?? {})
                },
                include: ['src']
            },
            null,
            2
        ),
        'vite.config.js': `
${plugin ? `import plugin from '${plugin.module}'` : ''}
export default {
    ${plugin ? `plugins: [plugin(${plugin.options ?? ''})],` : ''}
    logLevel: 'error',
    build: {
        rollupOptions: { output: { format: 'iife', inlineDynamicImports: true, entryFileNames: 'app.js' } }
    }
}
`,
        ...files
    })

    run('npm', ['install', '--silent', ...deps], dir)
    run('npx', ['vite', 'build'], dir)

    // Run it, and ask the DOM whether the view drew.
    writeFileSync(
        join(dir, 'render.mjs'),
        `
import { readFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    runScripts: 'dangerously',
    pretendToBeVisual: true
})
globalThis.window = dom.window
const script = dom.window.document.createElement('script')
script.textContent = readFileSync('dist/app.js', 'utf8')
dom.window.document.body.appendChild(script)

await new Promise((resolve) => setTimeout(resolve, 300))

const drawn = dom.window.document.querySelector('#drawn')
if (!drawn || !drawn.textContent.includes('drawn from the package')) {
    console.error('  nothing drawn; body was: ' + dom.window.document.body.innerHTML.slice(0, 300))
    process.exit(1)
}
`
    )
    run('npm', ['install', '--silent', 'jsdom'], dir)
    run('node', ['render.mjs'], dir)
}

// ========== THE CONSUMERS ==========

const consumers = {
    /**
     * Plain Node, no bundler.
     *
     * The one that 1.2.0 would have failed: extensionless relative specifiers
     * are valid for a bundler and are not ESM, and nothing else here notices.
     */
    node(tarballs) {
        const dir = project('node', {
            'package.json': JSON.stringify({ name: 'verify-node', private: true, type: 'module' }, null, 2),
            'check.mjs': `
import { CubePresenter, Place, Scope, FlipIntent, Observable, observe, Logger } from 'wdc-cube'
import { ViewFactory } from 'wdc-cube-react'
import { ViewSlot, useSolidScopes } from 'wdc-cube-solid'
import * as testing from 'wdc-cube-test'

const fail = (what) => { console.error('  FAILED ' + what); process.exitCode = 1 }

if (![CubePresenter, Place, Scope, FlipIntent, Observable, observe].every((x) => typeof x === 'function')) fail('wdc-cube')
if (ViewFactory == null) fail('wdc-cube-react')
if (typeof useSolidScopes !== 'function' || typeof ViewSlot !== 'function') fail('wdc-cube-solid')
if (Object.keys(testing).length === 0) fail('wdc-cube-test')

// The custom-element binding extends HTMLElement, so it needs one to evaluate.
globalThis.HTMLElement = class {}
const { CubeElement } = await import('wdc-cube-webc')
if (typeof CubeElement !== 'function') fail('wdc-cube-webc')

// And that it runs, not merely imports: a write has to report.
class Probe extends Scope {}
observe()(Probe.prototype, 'n')
const scope = new (Observable(Probe))()
let updates = 0
scope.update = () => updates++
scope.n = 7
if (scope.n !== 7 || updates !== 1) fail(\`reactivity (n=\${scope.n}, updates=\${updates})\`)
if (typeof Logger.get('probe').info !== 'function') fail('logger')
`
        })

        const wanted = ['wdc-cube', 'wdc-cube-react', 'wdc-cube-solid', 'wdc-cube-webc', 'wdc-cube-test']
        run('npm', ['install', '--silent', ...wanted.map((n) => tarballs[n]), ...peersOf('wdc-cube-solid')], dir)
        run('node', ['check.mjs'], dir)
    },


    /** React, drawn through the binding's own ViewFactory. */
    react(tarballs) {
        bundled({
            name: 'react',
            plugin: { module: '@vitejs/plugin-react', tsconfig: { jsx: 'react-jsx' } },
            deps: [
                tarballs['wdc-cube'],
                tarballs['wdc-cube-react'],
                ...peersOf('wdc-cube-react'),
                'vite@^8.0.0',
                '@vitejs/plugin-react@^6.0.0',
                'typescript@^6.0.0'
            ],
            files: {
                'src/main.tsx': `
import { createRoot } from 'react-dom/client'
import { Scope, Observable, observe } from 'wdc-cube'
import { ViewFactory, ViewSlot } from 'wdc-cube-react'

@Observable
class DemoScope extends Scope {
    @observe() title = 'drawn from the package'
}

function DemoView({ scope }: { scope: DemoScope }) {
    return <p id="drawn">{scope.title}</p>
}

ViewFactory.register(DemoScope, DemoView)
createRoot(document.getElementById('root')!).render(<ViewSlot scope={new DemoScope()} />)
`
            }
        })
    },

    /**
     * SolidJS.
     *
     * The consumer that matters most for this binding: `wdc-cube-solid` emitted
     * preserved JSX until 1.2.1, a file a bundler may or may not transform. Only
     * drawing settles it.
     */
    solid(tarballs) {
        bundled({
            name: 'solid',
            plugin: {
                module: 'vite-plugin-solid',
                tsconfig: { jsx: 'preserve', jsxImportSource: 'solid-js' }
            },
            deps: [
                tarballs['wdc-cube'],
                tarballs['wdc-cube-solid'],
                ...peersOf('wdc-cube-solid'),
                'vite@^8.0.0',
                'vite-plugin-solid@^2.11.0',
                'typescript@^6.0.0'
            ],
            files: {
                'src/main.tsx': `
import { render } from 'solid-js/web'
import { Scope, Observable, observe } from 'wdc-cube'
import { useSolidScopes, ViewFactory, ViewSlot } from 'wdc-cube-solid'

// Before any scope exists: it decides how every one of them reports a change.
useSolidScopes()

// Written as calls rather than as \`@Observable\` / \`@observe()\`, and that is
// faithful rather than convenient: in a Cube application the scopes live in the
// presentation layer, compiled by \`tsc\`, and a renderer never contains a
// decorator. The tutorial's SolidJS app configures no Babel decorator plugin
// for exactly that reason.
class Demo extends Scope {
    title = 'drawn from the package'
}
observe()(Demo.prototype, 'title')
const DemoScope = Observable(Demo)

function DemoView(props: { scope: Demo }) {
    return <p id="drawn">{props.scope.title}</p>
}

ViewFactory.register(DemoScope, DemoView)
render(() => <ViewSlot scope={new DemoScope()} />, document.getElementById('root')!)
`
            }
        })
    },

    /** Custom elements, with no framework underneath. */
    webc(tarballs) {
        bundled({
            name: 'webc',
            deps: [tarballs['wdc-cube'], tarballs['wdc-cube-webc'], 'vite@^8.0.0', 'typescript@^6.0.0'],
            files: {
                'src/main.tsx': `
import { Scope, Observable, observe } from 'wdc-cube'
import { CubeElement, CubeViewSlot, ViewFactory, type Dom } from 'wdc-cube-webc'

// See the note in the SolidJS consumer: a renderer holds no decorators.
class Demo extends Scope {
    title = 'drawn from the package'
}
observe()(Demo.prototype, 'title')
const DemoScope = Observable(Demo)

class DemoView extends CubeElement<Demo> {
    private paragraph!: HTMLParagraphElement

    protected declare(dom: Dom): void {
        this.paragraph = dom.p((element) => {
            element.id = 'drawn'
        })
    }

    protected override onUpdate(): void {
        this.paragraph.textContent = this.scope.title
    }
}

ViewFactory.define('demo-view', DemoScope, DemoView)

const slot = new CubeViewSlot(document.getElementById('root')!)
slot.setScope(new DemoScope())
`
            }
        })
    },

    /**
     * A real Angular application, with an ordinary tsconfig.
     *
     * `wdc-cube-angular@1.2.1` shipped TypeScript source, and the Angular
     * compiler refuses files carrying its metadata that are not in the
     * consumer's program. It installed; it could not be built.
     */
    angular(tarballs) {
        const dir = project('angular', {
            'package.json': JSON.stringify(
                {
                    name: 'verify-angular',
                    private: true,
                    version: '0.0.0',
                    devDependencies: { '@angular/build': '^22.0.0', '@angular/cli': '^22.0.0', typescript: '~6.0.0' }
                },
                null,
                2
            ),
            'angular.json': JSON.stringify(
                {
                    version: 1,
                    projects: {
                        app: {
                            projectType: 'application',
                            root: '',
                            sourceRoot: 'src',
                            architect: {
                                build: {
                                    builder: '@angular/build:application',
                                    options: { browser: 'src/main.ts', tsConfig: 'tsconfig.json', index: 'src/index.html' }
                                }
                            }
                        }
                    }
                },
                null,
                2
            ),
            'tsconfig.json': JSON.stringify(
                {
                    compilerOptions: {
                        target: 'ES2022',
                        module: 'preserve',
                        moduleResolution: 'bundler',
                        lib: ['ES2022', 'DOM'],
                        strict: true,
                        skipLibCheck: true,
                        // Cube's scopes use legacy decorators. That is a fact
                        // about the library a consumer matches, not a packaging
                        // question — so the fixture states it, as a reader would.
                        experimentalDecorators: true,
                        emitDecoratorMetadata: true
                    },
                    // Deliberately only the app's own sources: the point is that
                    // the package needs nothing added here.
                    include: ['src/**/*.ts']
                },
                null,
                2
            ),
            'src/index.html': '<!doctype html><html><body><app-root></app-root></body></html>',
            'src/main.ts': `
import { Component, input, signal } from '@angular/core'
import { bootstrapApplication } from '@angular/platform-browser'
import { Scope, Observable, observe } from 'wdc-cube'
import { bindScope, ViewFactory, CubeViewSlot } from 'wdc-cube-angular'

@Observable
class DemoScope extends Scope {
    @observe() title = 'drawn from the package'
}

@Component({ selector: 'app-demo', standalone: true, template: '<p id="drawn">{{ scope().title }}</p>' })
class DemoView {
    readonly scope = input.required<DemoScope>()
}

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CubeViewSlot],
    template: '<div><ng-container *cubeViewSlot="body()"></ng-container></div>'
})
class AppComponent {
    readonly body = signal<Scope | undefined>(new DemoScope())
    constructor() {
        ViewFactory.register(DemoScope, DemoView)
        bindScope(this.body)
    }
}

bootstrapApplication(AppComponent).catch((error) => console.error(error))
`
        })

        run(
            'npm',
            [
                'install',
                '--silent',
                tarballs['wdc-cube'],
                tarballs['wdc-cube-angular'],
                ...peersOf('wdc-cube-angular'),
                '@angular/compiler@^22.0.0',
                '@angular/platform-browser@^22.0.0',
                'rxjs@^7.8.0'
            ],
            dir
        )
        run('npx', ['ng', 'build'], dir)
    }
}

// ========== RUN ==========

const wanted = argv.slice(2)
const names = wanted.length > 0 ? wanted : Object.keys(consumers)

for (const name of names) {
    if (!consumers[name]) {
        stdout.write(`no consumer named ${name}\n`)
        exit(1)
    }
}

rmSync(work, { recursive: true, force: true })
stdout.write('packing\n')
const tarballs = packEverything()

let failed = 0
for (const name of names) {
    stdout.write(`  ${name} … `)
    try {
        consumers[name](tarballs)
        stdout.write('ok\n')
    } catch (caught) {
        failed++
        stdout.write('FAILED\n\n')
        stdout.write(`${caught.stdout ?? ''}${caught.stderr ?? caught.message}\n\n`)
    }
}

exit(failed > 0 ? 1 : 0)
