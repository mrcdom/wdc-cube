# cube-tutorial-react

The React view layer of the [Cube architecture](../../README.md) example, built
with Vite, React 19, MUI 9 and SCSS. It doubles as the manual test bed for
`wdc-cube-react`.

Everything that does not draw — places, keys, presenters, scopes and services —
lives in [cube-tutorial-core](../cube-tutorial-core/README.md), which depends on
`wdc-cube` alone. This package holds only views and the bootstrap, so an example
in another view technology can sit alongside it and reuse the same core.

## Running it

From the workspace root:

```bash
pnpm install
pnpm compile      # the app consumes wdc-cube / wdc-cube-react from lib/
                  # cube-tutorial-core is consumed as source, so it needs no build
pnpm start        # http://localhost:3000
```

Or from this directory: `pnpm dev`, `pnpm build`, `pnpm preview`, `pnpm typecheck`.

Data comes from `TutorialService`, an in-memory mock registered as a singleton —
there is no back end to run.

The **Run the stress test** button under the todo list swaps the sample data for
1000 generated items and a clock ticking every second, which is what exercises
the update debouncing and the `hint()` given to the update manager. It navigates
rather than mutating state, so the mode lands in the URL (`?todo-uid=-1`) and
survives a reload.

## What each module demonstrates

The modules below are split across the two packages: the presenter and scope in
`cube-tutorial-core`, the views here.

| Module | What to look at |
| --- | --- |
| [main](../cube-tutorial-core/src/modules/main) | The application shell. `MainPresenter` extends `ApplicationPresenter`: it owns the root scope, the body and dialog slots, and the global `alert()` used by every other presenter. |
| [todo-mvc](../cube-tutorial-core/src/modules/todo-mvc) | The busiest module. Nested scopes (header, main, footer, per-item), `ObservableArray` for the item list, `onBeforeScopeUpdate()` computing derived state in one pass, update hints for debouncing, and filters and the stress toggle round-tripping through the URL (`?todo-showing=1`, `?todo-uid=-1`). |
| [subscriptions](../cube-tutorial-core/src/modules/subscriptions) | Two places, one nested in the other. The detail place renders into the shell's *dialog* slot instead of the body, and carries a parameter (`?site-id=1`) so the dialog survives a reload. |
| [restricted](../cube-tutorial-core/src/modules/restricted) | The smallest presenter, showing slot chaining: it receives a parent slot and offers its own to whatever is deeper in the tree. |

## Folder layout

```
index.html                      Vite entry point (source, not a static asset)
public/favicon.ico              genuine static assets
vite.config.ts
src/scripts/
    main.tsx                    bootstraps services, views, routes, React root
    modules/
        ViewCatalog.ts          registers every scope→view pair
        <module>/
            index.ts              registerViews for this module
            v-*.tsx               one file per view
            *.module.scss         styles, scoped per file
    styles/                     global stylesheet
```

Views are prefixed `v-` and named after what they render, so a module folder
reads as a list of screens. There is no `view/` level: the whole package is the
view layer, so module names line up on both sides of the split —
`./modules/todo-mvc` here holds what `wdc-cube-tutorial-core/todo-mvc` drives.

## The patterns worth copying

**Keys wrap intent parameters.** Rather than reading raw strings from a
`FlipIntent`, each module has a `*.key.ts` class in the core exposing typed
properties:

```ts
const keys = new TodoMvcKeys(this.app, intent)
keys.showing = ShowingOptions.ACTIVE   // writes ParamIds.TodoShowing
await keys.flip()                      // navigates
```

Parameter names live in one place (`RouteConsts.ts`), so the short URL keys can
change without touching presenters.

**Scopes are observable state, not components.** A scope declares `@observe()`
fields; assigning to one schedules a view update. Views never hold application
state — they render a scope and call its actions.

**Views resolve through the catalog.** `ViewFactory.register(SomeScope, SomeView)`
pairs a scope class with a component, and `<ViewSlot scope={...} />` renders
whatever scope currently sits in a slot. That is what lets a presenter place a
child anywhere without knowing which component will draw it.

**Actions are guarded at binding time.** Handlers exposed on a scope are wrapped
with `this.action(...)`, which reports failures, updates the scope and refreshes
the URL:

```ts
this.scope.onOpenTodos = this.action(this.onOpenTodos)
```

Methods deliberately left unguarded — the ones that only mirror what the user is
typing — keep a plain `bind` and say so in a comment.

## Notes

The "What needs to be done?" field is intentionally **uncontrolled**
(`defaultValue` plus an effect). Scope updates are asynchronous, and React
restores the value of controlled inputs at the end of every event, which would
erase each keystroke before the scope caught up. The comment in
[v-header.tsx](src/scripts/modules/todo-mvc/view/v-header.tsx) explains it.
