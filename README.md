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

This repository holds the framework and a tutorial application that exercises it.

## Packages

| Path                                                     | Package                  | What it is                                                                                                                                                                                                                      |
| -------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [libs/cube](libs/cube)                                   | `wdc-cube`               | The framework core: `Place`, `Presenter`, `CubePresenter`, `ApplicationPresenter`, `Scope`, `FlipIntent`, `CubeBuilder`, `PageHistoryManager`, plus utilities. No view technology in it. See its [README](libs/cube/README.md). |
| [libs/cube-react](libs/cube-react)                       | `wdc-cube-react`         | React bindings: `ViewFactory`/`ViewSlot` to resolve a scope to its view, `classToFComponent` and `bindUpdate` to connect a scope to a component. See its [README](libs/cube-react/README.md).                                   |
| [apps/cube-tutorial-core](apps/cube-tutorial-core)       | `wdc-cube-tutorial-core` | The view-agnostic half of the example: places, keys, presenters, scopes and services. Depends on `wdc-cube` only, so a view written in any technology can drive it.                                                             |
| [apps/cube-tutorial-react](apps/cube-tutorial-react)     | —                        | The React view layer over that core, and the runnable app. See its [README](apps/cube-tutorial-react/README.md).                                                                                                                |
| [libs/cube-angular](libs/cube-angular)                   | `wdc-cube-angular`       | Angular bindings: `bindScope` to answer `scope.forceUpdate()`, `ViewFactory` and the `*cubeViewSlot` directive to resolve a scope to a component.                                                                               |
| [apps/cube-tutorial-angular](apps/cube-tutorial-angular) | —                        | The same core driven by Angular instead, so the two apps differ only in the binding. See its [README](apps/cube-tutorial-angular/README.md).                                                                                    |
| [libs/cube-webc](libs/cube-webc)                         | `wdc-cube-webc`          | Custom-element bindings: `CubeElement` is the view and the element at once, `Dom` declares a tree by nesting, `ViewFactory` maps a scope to a tag. No framework underneath. See its [README](libs/cube-webc/README.md).         |
| [libs/cube-test](libs/cube-test)                         | `wdc-cube-test`          | Test helpers for driving a presentation layer with no view attached. See its [README](libs/cube-test/README.md).                                                                                                                |
| [apps/cube-tutorial-webc](apps/cube-tutorial-webc)       | —                        | The same core drawn by the platform alone, on port 3003.                                                                                                                                                                        |
| [apps/cube-tutorial-test](apps/cube-tutorial-test)       | —                        | The same core exercised with no view at all, beside the two apps that render it. See its [README](apps/cube-tutorial-test/README.md).                                                                                           |

## Requirements

- **Node** 20.19+ or 22.12+ (required by Vite 7)
- **pnpm** — the version is pinned in `packageManager`, so `corepack enable pnpm`
  is enough; no global install needed.

## Getting started

```bash
corepack enable pnpm     # once per machine
pnpm install
pnpm compile             # builds the libraries and the tutorial core
pnpm start               # runs the React tutorial at http://localhost:3000
pnpm start:angular       # runs the Angular tutorial at http://localhost:3001
pnpm start:webc # runs the custom-element tutorial at http://localhost:3003
```

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
pnpm start:webc # dev server for the custom-element tutorial (port 3003)
pnpm clean          # removes lib/, dist/, build/, coverage/, *.tsbuildinfo
```

## Repository layout

```
libs/cube/src/
    index.ts            public API
    impl/               implementation
    impl/utils/         Logger, SingletonServices, query-string, reflection
libs/cube-react/src/
    index.ts            public API
    impl/               implementation
apps/cube-tutorial-core/    example: everything that does not draw
apps/cube-tutorial-react/   example: the React views and the app shell
apps/cube-tutorial-angular/ example: the same core, drawn by Angular
libs/cube-test/src/         test helpers, for a presentation layer with no view
apps/cube-tutorial-test/    example: the same core, drawn by nothing
eslint.config.mjs       one flat config for the whole workspace
.prettierrc.json        one formatting config for the whole workspace
tsconfig.json           shared compiler options
tsconfig.build.json     project references used by `pnpm compile`
```

Both libraries compile to `lib/` and declare `exports`, `files` and
`sideEffects`, so they are publishable as-is. Build output is not tracked in git.

The example is split in two so the framework's own separation is visible in the
file tree: `cube-tutorial-core` holds the places, presenters and scopes and never
imports React, while `cube-tutorial-react` holds only views and the bootstrap, with no `view/` level
since the whole package is the view layer.
`cube-tutorial-angular` is that same core drawn by Angular, and adding it needed
no change to the core at all. The core is consumed as
source — its `exports` point at `.ts` files — and exposes one subpath per module,
because scope names repeat across modules.

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

MIT © WeDoCode Consultoria e Soluções Avançadas LTDA
