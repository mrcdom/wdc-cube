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

## What React brings

Cube decides *what* changed; React decides *what to do about it*. The two halves
meet at exactly one function.

For the other side of that boundary — how presenters, places and the update
pipeline work — see [The Cube architecture](../../docs/architecture.md).

### How a scope change reaches the DOM

A presenter never calls React. It assigns to a scope field, and the chain runs
itself:

1. An `@observe()` field is assigned, or the presenter calls `update(scope)`
2. `ScopeUpdateManager` records the scope as dirty — or, when the presenter's own
   root scope changes, marks the whole subtree for update
3. A flush is scheduled once through `CallbackManager`, on a ~16 ms timer, so a
   burst of assignments collapses into one pass
4. On flush, `onBeforeScopeUpdate` listeners run first — that is where derived
   state is computed in one go — and then each dirty scope's `forceUpdate()` is
   called
5. `forceUpdate` is whatever the view bound to it. Here, `classToFComponent`
   bound it to a `useState` counter, so calling it schedules a React re-render

```
presenter → scope field → dirty set → 16ms flush → scope.forceUpdate()
                                                          ↓
                                        setState → React reconciles → DOM
```

`scope.forceUpdate` is the whole contract. A scope carries no view type and no
framework object, which is why `cube-tutorial-core` compiles without React at
all — and why a different view technology only has to answer that one call.

### What React contributes past that point

**Reconciliation is the division of labour.** Cube's granularity is the scope: it
knows *this scope changed*, not which of its fields. React's granularity is the
element. So marking a scope dirty costs one diff of that component's output, and
a change to a single field ends up as a single text-node write. Cube is spared
having to track field-level dependencies.

**The component tree mirrors the scope tree.** `ViewSlot` renders whatever
component is registered for the scope currently sitting in a slot, so the tree of
scopes a presenter assembles becomes a tree of components without either side
naming the other.

**Keys give list identity.** In `v-main.tsx` each item is rendered as
`<ViewSlot key={todo.id} scope={todo} view={ItemView} />`. Reordering or removing
items moves DOM nodes instead of rebuilding them, and each item's own state — the
edit field, its focus — travels with it.

**Batching absorbs the flush.** A flush may call `forceUpdate()` on many scopes;
React coalesces those into one commit rather than one layout pass each.

**`hint()` is Cube deferring to reconciliation.** The todo presenter registers
`hint(ItemScope, mainScope, 10)`: if more than ten item scopes are dirty in the
same flush, update the *list* scope instead of the items. Re-rendering one parent
and letting React diff the children beats a thousand individual state updates —
which is what the **Run the stress test** button exists to show.

### The shape of a view

Views are classes wrapped by `classToFComponent`. The instance is memoised for
the component's lifetime, which is what makes the pattern worth its indirection:

```ts
class ItemViewClass extends FCClass<ItemViewProps> {
    private readonly onToggle = () => this.scope.actions.onToggle()

    render({ className }: ItemViewProps) {
        return <li className={className}>{this.scope.title}</li>
    }
}

export const ItemView = classToFComponent(ItemViewClass)
```

- **Handlers are stable by construction.** `onToggle` is created once, so its
  identity never changes between renders. In React that identity is what decides
  whether a child re-renders, so the usual `useCallback` and its dependency array
  simply have no reason to exist here
- **`this.scope` is refreshed before every render**, so a handler reads the
  current scope rather than closing over the prop it saw when it was created —
  the stale-closure problem the dependency arrays were guarding against
- **Lifecycle maps onto hooks**: `onSyncState` runs before render, `onAttach` and
  `onDetach` on mount and unmount, `onAfterRender` after the DOM is committed.
  A class pays only for what it declares — the after-render effect is registered
  only for classes that define `onAfterRender`, decided once per class

### Where the fit is imperfect

Worth knowing before writing views, and worth weighing when choosing another
view technology.

**Scope updates are asynchronous; React's controlled inputs are not.** React
restores a controlled input's value at the end of every event, and the scope's
new value only arrives on the next flush — so an `<input value={scope.field}>`
loses keystrokes typed faster than the timer. The two fields whose value comes
from a scope are uncontrolled for that reason, reading through a ref and letting
the presenter push back only when it is the one changing them; the comment in
[v-header.tsx](src/scripts/modules/todo-mvc/v-header.tsx) works through it.

**A scope binds one component.** `forceUpdate` is a single slot, so two
components rendering the same scope means the last one to render wins. Scopes are
meant to be per-view.

**The binding is written during render.** `classToFComponent` assigns
`scope.forceUpdate` in the render body so it is live immediately, rather than
after the commit. It works, but it is a mutation during render, which React's
concurrent rendering discourages.

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

The patterns that shape presenters, scopes and keys belong to the core and are
described in [its README](../cube-tutorial-core/README.md#the-patterns-worth-copying).
What is specific to this package:

**Views resolve through the catalog.** `ViewFactory.register(SomeScope, SomeView)`
pairs a scope class with a component, and `<ViewSlot scope={...} />` renders
whatever scope currently sits in a slot. That is what lets a presenter place a
child anywhere without knowing which component will draw it — and what a second
view technology has to provide an equivalent of.

**Views are classes over `FCClass`.** The instance is memoised for the
component's lifetime, so handlers written as arrow-function fields are stable by
construction and no `useCallback` is needed. `FCClass<P>` already declares
`scope`, typed from the props, so views do not redeclare it:

```ts
class ItemViewClass extends FCClass<ItemViewProps> {
    private readonly onToggle = () => this.scope.actions.onToggle()

    render({ className }: ItemViewProps) {
        return <li className={className}>{this.scope.title}</li>
    }
}

export const ItemView = classToFComponent(ItemViewClass)
```
