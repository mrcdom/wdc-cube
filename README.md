# wdc-cube

**Cube** is a front-end architecture that keeps application logic out of the view
layer. Screens are described by three collaborating pieces:

| Piece         | Role                                                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Place**     | A node in the navigation tree. Places form a hierarchy, and a URL is a path through it.                                |
| **Presenter** | Owns the logic of a place: loads data, reacts to user actions, decides what to navigate to. Knows nothing about React. |
| **Scope**     | The observable state a presenter publishes for a view to render. Mutating an observed field schedules an update.       |

Navigation happens through a **FlipIntent** — a serializable description of "go
to this place with these parameters" that maps one-to-one to the browser URL. A
presenter never touches the router: it fills an intent and flips to it, and the
URL follows.

Because presenters and scopes are plain TypeScript, they can be unit-tested
without a DOM, and the React binding is a thin layer that renders a scope and
forwards user events back to it.

This repository holds the framework and two applications that exercise it: a
tutorial drawn four times over by four view technologies, and a showcase — an
issue tracker with a backend, latency and screens the size of real ones, which
is [live here](https://mrcdom.github.io/wdc-cube/).

## Packages

| Path                                                                         | Package                     | What it is                                                                                                                                                                                                                      |
| ---------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [libs/cube](libs/cube)                                                       | `wdc-cube`                  | The framework core: `Place`, `Presenter`, `CubePresenter`, `ApplicationPresenter`, `Scope`, `FlipIntent`, `CubeBuilder`, `PageHistoryManager`, plus utilities. No view technology in it. See its [README](libs/cube/README.md). |
| [libs/cube-react](libs/cube-react)                                           | `wdc-cube-react`            | React bindings: `ViewFactory`/`ViewSlot` to resolve a scope to its view, `classToFComponent` and `bindUpdate` to connect a scope to a component. See its [README](libs/cube-react/README.md).                                   |
| [libs/cube-angular](libs/cube-angular)                                       | `wdc-cube-angular`          | Angular bindings: `bindScope` to answer `scope.forceUpdate()`, `ViewFactory` and the `*cubeViewSlot` directive to resolve a scope to a component.                                                                               |
| [libs/cube-webc](libs/cube-webc)                                             | `wdc-cube-webc`             | Custom-element bindings: `CubeElement` is the view and the element at once, `Dom` declares a tree by nesting, `ViewFactory` maps a scope to a tag. No framework underneath. See its [README](libs/cube-webc/README.md).         |
| [libs/cube-solid](libs/cube-solid)                                           | `wdc-cube-solid`            | SolidJS bindings: an instrumentation that gives every observed field a signal of its own, plus `ViewFactory`/`ViewSlot`. See its [README](libs/cube-solid/README.md).                                                           |
| [libs/cube-test](libs/cube-test)                                             | `wdc-cube-test`             | Test helpers for driving a presentation layer with no view attached. See its [README](libs/cube-test/README.md).                                                                                                                |
| [apps/cube-tutorial/presentation](apps/cube-tutorial/presentation)           | `…-tutorial-presentation`   | The example, minus anything that draws: places, keys, presenters, scopes and services. Depends on `wdc-cube` only, so a renderer in any technology can drive it. See its [README](apps/cube-tutorial/presentation/README.md).   |
| [apps/cube-tutorial/presentation-test](apps/cube-tutorial/presentation-test) | `…-presentation-test`       | That presentation layer exercised with nothing drawing it, beside the three projects that render it. See its [README](apps/cube-tutorial/presentation-test/README.md).                                                          |
| [apps/cube-tutorial/renderer-react](apps/cube-tutorial/renderer-react)       | `…-renderer-react`          | The same presentation drawn by React and MUI, and a runnable app. See its [README](apps/cube-tutorial/renderer-react/README.md).                                                                                                |
| [apps/cube-tutorial/renderer-angular](apps/cube-tutorial/renderer-angular)   | `…-renderer-angular`        | The same presentation drawn by Angular and Angular Material, so the two differ only in the binding. See its [README](apps/cube-tutorial/renderer-angular/README.md).                                                            |
| [apps/cube-tutorial/renderer-webc](apps/cube-tutorial/renderer-webc)         | `…-renderer-webc`           | The same presentation drawn by custom elements and Spectrum Web Components — no framework underneath. See its [README](apps/cube-tutorial/renderer-webc/README.md).                                                             |
| [apps/cube-tutorial/renderer-solid](apps/cube-tutorial/renderer-solid)       | `…-renderer-solid`          | The same presentation drawn by SolidJS: the component runs once and a signal per field wakes one expression. See its [README](apps/cube-tutorial/renderer-solid/README.md).                                                     |
| [apps/cube-showcase/api](apps/cube-showcase/api)                             | `…-showcase-api`            | The showcase's backend: the data it runs on and the endpoints that answer for it, served by a worker rather than a server.                                                                                                      |
| [apps/cube-showcase/presentation](apps/cube-showcase/presentation)           | `…-showcase-presentation`   | The showcase, minus anything that draws. Every filter, page and open dialog is a place, so the address bar carries them.                                                                                                        |
| [apps/cube-showcase/renderer-solid](apps/cube-showcase/renderer-solid)       | `…-showcase-renderer-solid` | The showcase drawn by SolidJS, with Kobalte, TanStack Table and pragmatic-drag-and-drop. See the example's [README](apps/cube-showcase/README.md).                                                                              |

The example packages are prefixed `wdc-cube-tutorial-` and `wdc-cube-showcase-`,
elided as `…` above. The six libraries are published; the example projects are
private.

## Requirements

- **Node** 20.19+ or 22.12+ (required by Vite 7)
- **pnpm** — the version is pinned in `packageManager`, so `corepack enable pnpm`
  is enough; no global install needed.

## Getting started

```bash
corepack enable pnpm  # once per machine
pnpm install
pnpm compile          # builds the libraries and the presentation layer
pnpm start            # runs the React tutorial at http://localhost:3000
pnpm start:angular    # runs the Angular tutorial at http://localhost:3001
pnpm start:webc       # runs the custom-element tutorial at http://localhost:3002
pnpm start:solid      # runs the SolidJS tutorial at http://localhost:3003
pnpm start:showcase   # runs the showcase at http://localhost:3004
```

The showcase is also published at <https://mrcdom.github.io/wdc-cube/>, which is
possible because it is static all the way down: it routes on the hash, so no
server rewrites are needed, and its API is a service worker, so there is no
server at all.

## Commands

Run from the workspace root:

```bash
pnpm compile        # tsc -b: builds libs/* into their lib/ folders
pnpm build          # compile + each workspace's own build
pnpm test           # vitest across every package that has tests
pnpm lint           # eslint (flat config, whole workspace)
pnpm format         # prettier --write
pnpm format:check   # prettier --check
pnpm start          # dev server for the React tutorial (port 3000)
pnpm start:angular  # dev server for the Angular tutorial (port 3001)
pnpm start:webc     # dev server for the custom-element tutorial (port 3002)
pnpm start:solid    # dev server for the SolidJS tutorial (port 3003)
pnpm start:showcase # dev server for the showcase (port 3004)
pnpm clean          # removes lib/, dist/, build/, coverage/, *.tsbuildinfo
```

## Repository layout

```
libs/cube/src/
    index.ts                        public API
    impl/                           implementation
    impl/utils/                     Logger, SingletonServices, query-string, reflection
libs/cube-react/src/                React bindings
libs/cube-angular/src/              Angular bindings
libs/cube-webc/src/                 custom-element bindings
libs/cube-solid/src/                SolidJS bindings
libs/cube-test/src/                 test helpers, for a presentation layer with no view
apps/cube-tutorial/                 one example, one folder per project
    presentation/                   places, keys, presenters, scopes, services
    presentation-test/              the same presentation, drawn by nothing
    renderer-react/                 the same presentation, drawn by React
    renderer-angular/               the same presentation, drawn by Angular
    renderer-webc/                  the same presentation, drawn by the platform alone
    renderer-solid/                 the same presentation, drawn by SolidJS
apps/cube-showcase/                 the other example: an issue tracker
    api/                            its backend, answered by a worker
    presentation/                   places, keys, presenters, scopes, services
    renderer-solid/                 drawn by SolidJS
eslint.config.mjs                   one flat config for the whole workspace
.prettierrc.json                    one formatting config for the whole workspace
tsconfig.json                       shared compiler options
tsconfig.build.json                 project references used by `pnpm compile`
```

The libraries compile to `lib/` and declare `exports`, `files` and
`sideEffects`, so they are publishable as-is. Build output is not tracked in git.

The example is split so that the framework's own separation is visible in the
file tree, and the names sort by layer. `presentation/` holds the places,
presenters and scopes and imports no view technology at all; `presentation-test/`
drives it with nothing attached; the four `renderer-*/` projects hold only views
and a bootstrap, with no `view/` level inside them since each package is entirely
the view layer.

Adding the second renderer, the third and the fourth needed no change to the
presentation layer — which is the claim the example exists to demonstrate. It
compiles to `lib/` like the libraries do, and exposes one subpath per module —
`wdc-cube-tutorial-presentation/todo-mvc` and the rest — because scope names
repeat across modules.

That second example is `cube-showcase/`, which is why the tutorial's projects are
gathered in a folder of their own rather than named by prefix. It splits the same
way with one addition: `api/` is a package because answering HTTP is not a
rendering concern, and a second renderer of the showcase should be able to have a
backend without importing the SolidJS project.

The two examples make different arguments. The tutorial shows one presentation
layer driven by four view technologies — the boundary is technology-neutral. The
showcase shows that same boundary carrying an application's weight: a backend
with latency, a dashboard, a drag-and-drop board, a third-party table told to
keep no state, and a filter, a page and an open dialog that are all places, so a
link carries them. See its [README](apps/cube-showcase/README.md).

## How the pieces fit

A short tour follows; [The Cube architecture](docs/architecture.md) covers the
same ground in depth — the navigation lifecycle, presenter reuse and release,
slots, the update pipeline and hints, and what a new view technology has to
provide.

A minimal picture of one navigation:

```
URL  ──parse──▶  FlipIntent  ──▶  Application walks the Place tree
                                     │
                                     ▼
                          Presenter.applyParameters(intent, …)
                                     │  loads data, mutates
                                     ▼
                                   Scope  ──ViewFactory──▶  React view
```

Going the other way, a user event calls an action on the scope, the presenter
handles it, and `publishParameters` writes the presenter's state back into the
URL.

**Actions.** Handlers that a presenter exposes on a scope should be wrapped with
a guard, which reports failures through `unexpected()`, triggers the scope
update and refreshes the URL. Build the guard where you attach the method to the
scope:

```ts
this.scope.onSave = this.action(this.onSave)
```

The `@action()` decorator does the same thing and still works, but the form above
makes it visible at the binding site which handlers are guarded and which are
deliberately not.

## Conventions

These are recommendations, not lint rules. Where the code already disagrees,
prefer the convention for new code rather than rewriting what is there.

**Prefer named exports for components.** React itself takes no side — its docs
say "do what works best for you", and note only that anonymous defaults like
`export default () => {}` hurt debugging. The reason to pick one here is
consistency: with a default export the name is invented at each import site, so
nothing stops the same component from being imported under two names, or a name
from drifting away from its file. A named export has to match, which is also
what makes rename, find-references and auto-import reliable. Both published
packages already export only named symbols.

Two cases legitimately need a default export: a Next.js route file, and
`React.lazy(() => import('./x'))` — and even that one takes a wrapper:

```ts
const X = lazy(() => import('./v-x').then((m) => ({ default: m.XView })))
```

**Write views as classes over `FCClass`.** `classToFComponent` memoises the
instance for the component's lifetime, so methods are stable references and
handlers need no `useCallback`. `FCClass<P>` already declares `scope`, typed
from the props, so views do not redeclare it.

**Guard actions at the binding site**, as shown above.

## License

MIT © WeDoCode Consultoria e Soluções Avançadas LTDA. See [LICENSE](LICENSE).
