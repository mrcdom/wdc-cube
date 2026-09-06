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

## Notes

The "What needs to be done?" field is intentionally **uncontrolled**
(`defaultValue` plus an effect). Scope updates are asynchronous, and React
restores the value of controlled inputs at the end of every event, which would
erase each keystroke before the scope caught up. The comment in
[v-header.tsx](src/scripts/modules/todo-mvc/view/v-header.tsx) explains it.
