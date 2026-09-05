# cube-tutorial

A runnable example of the [Cube architecture](../../README.md), built with Vite,
React 19, MUI 7 and SCSS. It exists to show how `Place`, `Presenter` and `Scope` fit
together in a real application, and it doubles as the manual test bed for the
framework.

## Running it

From the workspace root:

```bash
pnpm install
pnpm compile      # the app consumes wdc-cube / wdc-cube-react from lib/
pnpm start        # http://localhost:3000
```

Or from this directory: `pnpm dev`, `pnpm build`, `pnpm preview`, `pnpm typecheck`.

Data comes from `TutorialService`, an in-memory mock registered as a singleton —
there is no back end to run.

Useful while working on the framework: **`#/todos?todo-uid=-1`** loads 1000 items
and a clock that ticks every second, which is what exercises the update
debouncing and the `hint()` given to the update manager.

## What each module demonstrates

| Module | What to look at |
| --- | --- |
| [main](src/scripts/modules/main) | The application shell. `MainPresenter` extends `ApplicationPresenter`: it owns the root scope, the body and dialog slots, and the global `alert()` used by every other presenter. |
| [todo-mvc](src/scripts/modules/todo-mvc) | The busiest module. Nested scopes (header, main, footer, per-item), `ObservableArray` for the item list, `onBeforeScopeUpdate()` computing derived state in one pass, update hints for debouncing, and a filter that round-trips through the URL (`?todo-showing=1`). |
| [subscriptions](src/scripts/modules/subscriptions) | Two places, one nested in the other. The detail place renders into the shell's *dialog* slot instead of the body, and carries a parameter (`?site-id=1`) so the dialog survives a reload. |
| [restricted](src/scripts/modules/restricted) | The smallest presenter, showing slot chaining: it receives a parent slot and offers its own to whatever is deeper in the tree. |

## Folder layout

```
index.html                      Vite entry point (source, not a static asset)
public/favicon.ico              genuine static assets
vite.config.ts
src/scripts/
    main.tsx                    bootstraps services, views, routes, React root
    modules/
        RouteConsts.ts          ParamIds, AttrIds and the Places table
        Routes.ts               the place tree (CubeBuilder.lazyBuild)
        ViewCatalog.ts          registers every scope→view pair
        <module>/
            <module>.key.ts       typed accessors over a FlipIntent
            <module>.presenter.ts logic
            <module>.scope.ts     observable state
            view/
                index.ts          registerViews for this module
                v-*.tsx           one file per view
                *.module.scss     styles, scoped per file
    services/                   TutorialService, registered as a singleton
    shared/                     helpers shared across modules
    styles/                     global stylesheet
```

Views are prefixed `v-` and named after what they render, so a module's `view/`
folder reads as a list of screens.

## The patterns worth copying

**Keys wrap intent parameters.** Rather than reading raw strings from a
`FlipIntent`, each module has a `*.key.ts` class exposing typed properties:

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
