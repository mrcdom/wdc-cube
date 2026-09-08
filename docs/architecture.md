# The Cube architecture

Cube is a front-end architecture for applications whose screens are addressable:
where a URL should name a state you can bookmark, reload and share, and where the
logic behind a screen should be testable without rendering it.

It is built on the idea that a screen has three separable concerns — *where you
are*, *what should happen*, and *what should be shown* — and that only the last
of them needs to know about the view technology.

## The four pieces

| | Role |
| --- | --- |
| **Place** | A node in the navigation tree. Places form a hierarchy, and a URL is a path through it. |
| **Presenter** | Owns the logic of a place: loads data, reacts to user actions, decides where to navigate. Knows nothing about the view. |
| **Scope** | The observable state a presenter publishes for a view to render. Assigning to an observed field schedules an update. |
| **FlipIntent** | A serializable "go to this place with these parameters". Maps one-to-one with the URL. |

The framework is split along the same line: `wdc-cube` holds all four and has no
view dependency; `wdc-cube-react` binds scopes to React components. A second view
technology means a second binding package, not a second framework.

## The place tree

Places are declared as a tree, and each one may name the presenter that owns it:

```ts
CubeBuilder.lazyBuild({
    todos: {
        presenter: Place.creator(TodoMvcPresenter, Places, 'todos')
    },
    subscriptions: {
        presenter: Place.creator(SubscriptionsPresenter, Places, 'subscriptions'),

        detail: {
            presenter: Place.creator(SubscriptionsDetailPresenter, Places, 'subscriptionsDetail')
        }
    }
})
```

A place knows its full path from the root, and that path is what a URL encodes.
`#/subscriptions/detail?site-id=1` means: walk root → `subscriptions` → `detail`,
carrying `site-id=1`.

Nesting is not merely cosmetic. Reaching `detail` also means `subscriptions` is
active, so its presenter is alive and its scope is on screen. That is how a
screen composes: outer places host inner ones.

## A navigation, step by step

Everything goes through `flipToIntent`. There is no router API to call and no
imperative "show this component".

1. The application creates a **FlipContext** for the target intent
2. It walks the target place's path from the root, and for each place:
   - if a presenter for that place already exists, it is **reused** and gets
     `applyParameters(intent, initialization: false, last)`
   - otherwise the presenter is **constructed** and gets
     `applyParameters(intent, initialization: true, last)`
   - `last` is true only for the target place, which is how a presenter knows
     whether it is the leaf or is hosting something deeper
3. A presenter that returns `false` **stops the walk**. That is the hook for
   guards: a restricted presenter with no session can navigate to login and
   return `false`, and the original navigation is abandoned
4. On success the context **commits**: presenters on the new path are kept, and
   every presenter that is no longer on it is **released**
5. On failure it **rolls back**, leaving the previous state intact
6. Either way, the URL is rewritten from the live presenters, by asking each one
   to `publishParameters(intent)`

Two consequences worth internalising:

- **Presenters survive navigation when they stay on the path.** Moving from
  `/subscriptions` to `/subscriptions/detail` does not rebuild the subscriptions
  presenter; it gets `applyParameters` again with `initialization: false`. State
  and loaded data survive, which is why `applyParameters` takes that flag
- **The URL is derived, not stored.** `publishParameters` rebuilds it from what
  the presenters currently hold, so the address bar cannot drift from the state

The reverse direction closes the loop: the `HistoryManager` reports back/forward
navigation, and the application turns the new location into an intent and flips
to it. Browser navigation and in-app navigation are the same code path.

## Slots: how a place hosts another

A parent does not know which child will be rendered inside it. It passes a
**ScopeSlot** — a function that accepts a scope — through the intent:

```ts
// parent, while not the deepest place
keys.parentSlot = this.bodySlot

// child, once it has its scope ready
this.parentSlot(this.scope)
```

The parent stores whatever scope it receives and renders it in place. This is
what lets `subscriptions/detail` appear in a *dialog* slot while `todos` appears
in the *body* slot, without either presenter knowing where it landed.

## Keys: typed access to an intent

Reading raw strings out of an intent scatters parameter names through the code.
Each module instead has a `*.key.ts` class that wraps one:

```ts
const keys = new TodoMvcKeys(this.app, intent)
keys.showing = ShowingOptions.ACTIVE   // writes ParamIds.TodoShowing
await keys.flip()                      // navigates
```

Parameter names live in one table, so the short URL keys can change without
touching a presenter.

## The update pipeline

A presenter never tells a view to redraw. It changes state, and the pipeline
runs:

1. An `@observe()` field is assigned — or the presenter calls `update(scope)`
2. The `ScopeUpdateManager` records that scope as **dirty**. If the presenter's
   own root scope changed, it marks the whole subtree instead
3. A flush is scheduled **once** through the `CallbackManager`, on a ~16 ms
   timer, so a burst of assignments collapses into a single pass
4. On flush, `onBeforeScopeUpdate` listeners run first. This is where derived
   state is computed in one place, seeing all the changes at once, rather than
   recomputed on each assignment
5. Then either the root scope's `forceUpdate()` is called, or — for a partial
   change — only the dirty scopes'

`Scope.forceUpdate` is the entire boundary with the view. A scope holds no view
type and no framework object; it holds a function that someone else installed.

**Update hints** let a presenter tell the pipeline when fine-grained updates stop
paying off:

```ts
this.updateManager.hint(ItemScope, this.mainScope, 10)
```

Above ten dirty item scopes in one flush, update the *list* scope instead. For a
view technology that diffs its own output, redrawing one parent is cheaper than a
thousand individual updates.

## Actions

Handlers a presenter exposes on a scope are wrapped with a guard, built where the
method is attached:

```ts
this.scope.onSave = this.action(this.onSave)
```

The guard reports failures through `unexpected()`, triggers the scope update and
refreshes the URL, for both synchronous and asynchronous handlers. Building it at
the binding site — rather than decorating the method — makes it visible which
handlers are guarded and which are deliberately not, and it can guard functions
that are not methods of the class at all.

## Services

`SingletonServices` holds application-wide singletons with a lifecycle:
`postConstruct` on start, `preDestroy` on shutdown. Presenters take them as
plain references, so a test can register a stub instead.

## What a view technology has to provide

The surface is deliberately small. To bind Cube to a rendering library you need
two things:

1. **A way to resolve a scope to a component.** `wdc-cube-react` does it with
   `ViewFactory.register(SomeScope, SomeView)` plus a `ViewSlot` component that
   renders whatever scope currently sits in a slot
2. **An answer to `scope.forceUpdate()`.** Whatever makes that view redraw. In
   React it is a `useState` counter

Everything else — places, intents, presenters, scopes, actions, services — is
already done and shared.

## What the separation buys

**Presenters are testable without a DOM.** `libs/cube`'s own test suite runs in a
Node environment with no browser and no view library: it builds a place tree,
navigates it, and asserts on presenter state and the resulting URL. If a
presenter could not be tested that way, it would be holding view concerns it
should not have.

**The view is replaceable.** [cube-tutorial/presentation](../apps/cube-tutorial/presentation)
holds the example's places, presenters, scopes and services and does not import
React — 24 files, all `.ts`, every external import from `wdc-cube`.
[cube-tutorial-react](../apps/cube-tutorial-react) holds the views. A second view
technology is a third package, with the core untouched.

**The URL is not an afterthought.** Because navigation is expressed as intents
and the address is derived from live state, deep-linking, reload and back/forward
work by construction rather than by remembering to handle them.

## Where to look

| Concern | File |
| --- | --- |
| Navigation, presenter lifecycle | [Application.ts](../libs/cube/src/impl/Application.ts), [FlipContext.ts](../libs/cube/src/impl/FlipContext.ts) |
| Update pipeline, hints | [Presenter.ts](../libs/cube/src/impl/Presenter.ts) (`ScopeUpdateManager`) |
| Flush scheduling | [CallbackManager.ts](../libs/cube/src/impl/CallbackManager.ts) |
| Observable scopes | [Scope.ts](../libs/cube/src/impl/Scope.ts), [decorators/](../libs/cube/src/impl/decorators) |
| Intents and URL encoding | [FlipIntent.ts](../libs/cube/src/impl/FlipIntent.ts), [Place.ts](../libs/cube/src/impl/Place.ts) |
| Action guard | [IPresenter.ts](../libs/cube/src/impl/IPresenter.ts) (`mkAction`) |
| React binding | [ReactFunctionalClass.ts](../libs/cube-react/src/impl/ReactFunctionalClass.ts), [ViewFactory.ts](../libs/cube-react/src/impl/ViewFactory.ts) |
| A worked example, end to end | [Cube.test.ts](../libs/cube/src/impl/Cube.test.ts) |
