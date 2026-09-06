# cube-tutorial-core

The half of the [tutorial](../cube-tutorial-react/README.md) that does not draw
anything: places, keys, presenters, scopes and services.

The concepts it is built from — places, presenters, scopes, intents, slots and
the update pipeline — are described in
[The Cube architecture](../../docs/architecture.md). This package is that
document made concrete; reading them side by side is the fastest way in.

It depends on `wdc-cube` and nothing else — no React, no view library, no `.tsx`.
That is the point: it is what a second example in another view technology would
reuse unchanged, and it keeps the architecture's central claim honest, since a
presenter that could not be separated from its view would not be one.

## Layout

```
src/index.ts                cross-cutting exports: Places, ParamIds, AttrIds,
                            initializeRoutes, registerServices
src/modules/
    RouteConsts.ts          ParamIds, AttrIds and the Places table
    Routes.ts               the place tree (CubeBuilder.lazyBuild)
    <module>/
        index.ts              the module's public surface
        <module>.key.ts       typed accessors over a FlipIntent
        <module>.presenter.ts logic
        <module>.scope.ts     observable state
src/services/               TutorialService, registered as a singleton
```

## Consuming it

The package is consumed as source: `exports` point at `.ts` files and whoever
imports it compiles them. There is no build step and no `lib/` to keep in sync.

Each module has its own subpath, because scope names repeat across modules —
`MainScope` exists in both `main` and `todo-mvc`, so a single flat barrel could
not carry them both:

```ts
import { initializeRoutes, registerServices } from 'wdc-cube-tutorial-core'
import { MainPresenter, MainScope } from 'wdc-cube-tutorial-core/main'
import { TodoMvcScope, ShowingOptions } from 'wdc-cube-tutorial-core/todo-mvc'
```

`MainPresenter` takes a `HistoryManager`, which is an abstraction from `wdc-cube`.
The React app passes `PageHistoryManager`; another view layer passes its own.
That injection is the only place the core touches the outside world.

Because the source is compiled by the consumer, its `tsconfig` decides which
global types are in scope. Code here should therefore avoid spellings that only
exist under one setup — `ReturnType<typeof setInterval>` rather than `number` or
`NodeJS.Timeout`, for instance.

## The patterns worth copying

Each of these has a section in
[The Cube architecture](../../docs/architecture.md); what follows is how they
look in this code.


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
fields; assigning to one schedules a view update. A scope holds no view type and
no framework object — which is why this package compiles without one, and why the
same scope can drive views written in different technologies.

**Actions are guarded at binding time.** Handlers exposed on a scope are wrapped
with `this.action(...)`, which reports failures, updates the scope and refreshes
the URL:

```ts
this.scope.onOpenTodos = this.action(this.onOpenTodos)
```

Methods deliberately left unguarded — the ones that only mirror what the user is
typing — keep a plain `bind` and say so in a comment.
