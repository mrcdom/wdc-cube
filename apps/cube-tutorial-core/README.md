# cube-tutorial-core

The half of the [tutorial](../cube-tutorial-react/README.md) that does not draw
anything: places, keys, presenters, scopes and services.

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
