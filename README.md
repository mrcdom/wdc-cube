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

| Path                                     | Package          | What it is                                                                                                                                                                                                       |
| ---------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [libs/cube](libs/cube)                   | `wdc-cube`       | The framework core: `Place`, `Presenter`, `CubePresenter`, `ApplicationPresenter`, `Scope`, `FlipIntent`, `CubeBuilder`, plus utilities (`Logger`, `SingletonServices`, `ObservableArray`). No React dependency. |
| [libs/cube-react](libs/cube-react)       | `wdc-cube-react` | React bindings: `ViewFactory`/`ViewSlot` to resolve a scope to its view, `bindUpdate` and `classToFComponent` to connect a scope to a component, `PageHistoryManager` to drive the URL.                          |
| [apps/cube-tutorial](apps/cube-tutorial) | —                | A runnable example. See its [README](apps/cube-tutorial/README.md).                                                                                                                                              |

## Requirements

- **Node** 20.19+ or 22.12+ (required by Vite 7)
- **pnpm** — the version is pinned in `packageManager`, so `corepack enable pnpm`
  is enough; no global install needed.

## Getting started

```bash
corepack enable pnpm     # once per machine
pnpm install
pnpm compile             # builds the two libraries
pnpm start               # runs the tutorial at http://localhost:3000
```

## Commands

Run from the workspace root:

```bash
pnpm compile        # tsc -b: builds libs/* into their lib/ folders
pnpm build          # compile + each workspace's own build
pnpm test           # vitest (libs/cube and libs/cube-react)
pnpm lint           # eslint (flat config, whole workspace)
pnpm format         # prettier --write
pnpm format:check   # prettier --check
pnpm start          # dev server for the tutorial app
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
apps/cube-tutorial/     example application
eslint.config.mjs       one flat config for the whole workspace
.prettierrc.json        one formatting config for the whole workspace
tsconfig.json           shared compiler options
tsconfig.build.json     project references used by `pnpm compile`
```

Both libraries compile to `lib/` and declare `exports`, `files` and
`sideEffects`, so they are publishable as-is. Build output is not tracked in git.

## How the pieces fit

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

## License

MIT © WeDoCode Consultoria e Soluções Avançadas LTDA
