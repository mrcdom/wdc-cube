# wdc-cube

The core of the [Cube architecture](https://github.com/mrcdom/wdc-cube/blob/master/docs/architecture.md): places,
intents, presenters, scopes, actions and the update pipeline.

It has no view technology in it, and no dependency on one. A binding package
supplies that — [`wdc-cube-react`](https://github.com/mrcdom/wdc-cube/tree/master/libs/cube-react#readme),
[`wdc-cube-angular`](https://github.com/mrcdom/wdc-cube/tree/master/libs/cube-angular#readme),
[`wdc-cube-webc`](https://github.com/mrcdom/wdc-cube/tree/master/libs/cube-webc#readme),
[`wdc-cube-solid`](https://github.com/mrcdom/wdc-cube/tree/master/libs/cube-solid#readme), or none at all when a test
drives the presenters directly with [`wdc-cube-test`](https://github.com/mrcdom/wdc-cube/tree/master/libs/cube-test#readme).

The architecture document explains how the pieces fit and is the place to start.
This one is about the package: what it exports, and the few things worth knowing
before reaching for them.

## What your tsconfig needs

Two settings, and they carry different weight.

```jsonc
{
  "compilerOptions": {
    // Required. `@observe()` and `@Observable` are legacy decorators; without
    // this they are read as the current proposal and fail to compile.
    "experimentalDecorators": true,

    // Recommended. `@observe()` installs an accessor on the prototype, and a
    // native class field defines an own property on every instance that shadows
    // it. The framework handles that — it reads the value back, deletes the
    // property and writes it through the accessor — but `delete` is what drops
    // an object into V8's dictionary mode. Measured in this repository: 298ns
    // per scope built against 98ns, and fast properties kept.
    "useDefineForClassFields": false
  }
}
```

Only the first is a requirement: with native class fields everything still
works, and every scope your application builds costs more than it needs to.

A renderer usually needs neither. In a Cube application the scopes live in the
presentation layer, compiled by `tsc`, and the views that draw them hold no
decorator at all — which is why the SolidJS example configures no Babel
decorator plugin, and why it would break if it had to.
## The shape of an application

```ts
class TodoPresenter extends CubePresenter<MainPresenter, TodoScope> {
    public override async applyParameters(intent: FlipIntent, initialization: boolean) {
        const keys = new TodoKeys(this.app, intent)

        if (initialization) {
            this.scope.actions.onClear = this.action(this.onClear)
            this.parentSlot = keys.parentSlot
        }

        this.parentSlot(this.scope)
        return true
    }
}
```

A presenter owns a scope and publishes it into the slot its parent offered.
Navigation is a `FlipIntent` aimed at a `Place`; the address bar is derived from
whatever state the presenters publish back, which is what makes deep links,
reload and back/forward work without anyone handling them.

## What is worth knowing

**Updates are batched, not immediate.** `update()` marks a scope; `CallbackManager`
flushes about sixteen milliseconds later, and only then does a view hear about
it. Code that reads a scope straight after changing it reads it mid-flight. In a
test, `settle()` from `wdc-cube-test` drains that queue instead of guessing at
the timer.

**A base update and a nested one are different things.** `update()` with no
argument marks the presenter's own scope; `update(childScope)` marks one below
it. Both are recorded, even together — a view that only refreshes what it was
told about needs the nested ones, and a view that redraws whole subtrees ignores
the extra notification harmlessly. `ScopeUpdateManager#hint()` is how a presenter
tells the manager that a large list is better redrawn at its parent than item by
item.

**Actions are guarded, and swallow what they throw.** `this.action(fn)` wraps a
method so it catches, reports through `unexpected()`, updates the scope and
publishes history when it finishes. That means an action never rejects into its
caller — convenient in a view, and a trap in a test, which should watch
`unexpected` if it wants failures to be loud. `@action()` is the older decorator
form of the same thing and still works.

**Observed fields mark the scope for you.** `@Observable` on a scope class turns
every `@observe()` field into an accessor that calls `update()` when the value
actually changes — assigning the same value again does nothing. `ObservableArray`
reports its own mutations the same way. So a presenter usually does not call
`update()` by hand; it does so for state the decorators cannot see, such as a
field it deliberately left plain. `@Observable` returns a subclass, which is why
an instance introspects as `ObservableTodoScope` rather than `TodoScope` —
`instanceof` still holds.

**`ScopeUtils.bind(scope, source)`** wires every action-shaped name on a scope
(`onSomething`) to the method of that name on the source, binding it, and warns
for any it cannot find. It is the bulk alternative to assigning each action in
`applyParameters`.

**Registries do not collide.** `createViewRegistry(name)` builds a store keyed by
a private symbol, so `wdc-cube-react`, `wdc-cube-angular`, `wdc-cube-webc` and
`wdc-cube-solid` can each register a
view for the same scope class without seeing each other. That is what lets one
set of presenters drive two applications at once.

## Exports

| Group | What |
| --- | --- |
| Navigation | `Place`, `FlipIntent`, `CubeBuilder` (`build`, `lazyBuild`), `HistoryManager`, `PageHistoryManager` |
| Presenters | `Presenter`, `CubePresenter`, `ApplicationPresenter`, `Application` |
| Scopes | `Scope`, `ObservableArray`, `ScopeUtils`, `@Observable`, `@observe` |
| Updates | `CallbackManager`, `ScopeUpdateManager` |
| Views | `createViewRegistry`, `ScopeSlot` |
| Utilities | `Logger`, `SingletonServices`, `ReflectionUtils`, the `NOOP_*` constants |
| Types | `IPresenter`, `ICubePresenter`, `IUpdateManager`, `AlertSeverity`, `IScope` |

`PageHistoryManager` lives here rather than in a binding because it only needs
`window.history` — no view technology is involved, and putting it in the React
package would have made an Angular application depend on React through its peers.

The `events` namespace re-exports DOM-event shapes (`TextChangeEvent`,
`KeyPressEvent`, and so on) so a scope can accept an event without its module
importing React's types. They are structural: a React `KeyboardEvent` and a
native one both satisfy them.

## Tests

`Cube.test.ts` builds a small application — root, login, restricted, cart,
product — and drives it through real navigations. It doubles as the most complete
worked example in the repository, and reads as one.

## Building it

```bash
pnpm compile        # from the workspace root; builds this and everything downstream
pnpm test
```

## The code, and something to look at

This is the core of the Cube architecture, and everything above is about using it. The argument it belongs to is easier to see than to read about.

**[Open the showcase](https://mrcdom.github.io/wdc-cube/)** — an issue tracker where every filter, page,
sorted column and open dialog is a place. Change one and watch the address bar:
Back undoes it, a reload lands on it, and the link you copy opens the same thing
for someone else. Nothing in it writes that URL — each presenter says what it is
showing, and the address is assembled from all of them.

**[Read the source](https://github.com/mrcdom/wdc-cube)** — one presentation layer, drawn by four view
technologies: React, Angular, SolidJS and custom elements. Adding the second, the
third and the fourth needed no change to the presenters, which is the claim the
repository exists to demonstrate, kept honest by having to hold four times over.

| | |
| --- | --- |
| This package's source | [`libs/cube`](https://github.com/mrcdom/wdc-cube/tree/master/libs/cube) |
| How the pieces fit | [The Cube architecture](https://github.com/mrcdom/wdc-cube/blob/master/docs/architecture.md) |
| The showcase | [live](https://mrcdom.github.io/wdc-cube/) · [source](https://github.com/mrcdom/wdc-cube/tree/master/apps/cube-showcase#readme) |
| The tutorial, drawn four ways | [source](https://github.com/mrcdom/wdc-cube/tree/master/apps/cube-tutorial) |
| Issues and discussion | [github.com/mrcdom/wdc-cube/issues](https://github.com/mrcdom/wdc-cube/issues) |

MIT © WeDoCode Consultoria e Soluções Avançadas LTDA.
