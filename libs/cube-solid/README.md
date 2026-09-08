# wdc-cube-solid

SolidJS bindings for the [Cube architecture](../../docs/architecture.md).

The architecture document states the view boundary as two obligations. This
package is those two, and one thing none of the other bindings needed:

| Obligation | Here |
| --- | --- |
| Answer `scope.forceUpdate()` | mostly nothing — see below |
| Resolve a scope to a view | `ViewFactory` + `ViewSlot` |
| Decide what a change wakes | `useSolidScopes()` |

Everything above that line — places, intents, presenters, scopes, actions,
services — comes from [`wdc-cube`](../cube/README.md) and is shared with any
other view technology.

## Why there is a third row

`forceUpdate` is a scope-wide signal: something in here changed, draw it again.
Every other binding is built on it, and for React, Angular and custom elements
that is exactly the right granularity — each of them redraws a component or a
view and works out the rest.

Solid's whole point is that it does not want to be told "something changed". A
component body runs **once**, and what it leaves behind is one effect per
expression, each waiting on the values that expression reads. Handed a scope-wide
notification, the best it can do is re-run every expression in the view — which
is React without the diff, and wastes what the library is for.

So this binding does not answer `forceUpdate` for fields at all. It takes over
how scopes are instrumented:

```ts
import { useSolidScopes } from 'wdc-cube-solid'

useSolidScopes() // before anything constructs a scope
```

`@Observable` builds a class's accessors the first time one of its instances
exists, and asks whoever is installed for them. The default installs one that
compares, stores, and calls `scope.update`. Solid's asks the framework for that
same accessor and wraps it, adding a signal per field, created per instance on
first use.

Which is why the ordering is not advice: the accessors go on a class the moment
the first instance is built, so this has to run before then. Calling it later
throws rather than leaving half an application reactive.

## A view is a function of a scope, and nothing else

```tsx
export function ItemView(props: ViewProps<ItemScope>): JSX.Element {
    return (
        <li classList={{ [Css.completed]: props.scope.completed }}>
            <label onDblClick={() => props.scope.actions.onEdit()}>{props.scope.title}</label>
        </li>
    )
}

ViewFactory.register(ItemScope, ItemView)
```

`props.scope.title` is a plain field read. Because of the instrumentation it is
also a signal read, so changing the title updates one text node and the
`classList` above it is not re-examined. No view mentions a signal, imports
anything from this package, or knows that the scope it was handed is reactive at
all — which is the property that makes these views comparable with the React and
Angular ones written from the same scopes.

## Rendering a slot

```tsx
<ViewSlot scope={props.scope.body} />
```

`ViewFactory.register(SomeScope, SomeView)` pairs a scope class with a component;
the slot renders whichever one matches the scope currently in it. That is how a
presenter places a child without naming the component that draws it.

The slot also calls `bindScope` on the way in, which is why views never do.

## What `bindScope` is still for

Two things the instrumentation cannot reach.

**Lists.** An `ObservableArray` is not an `@observe()` field: it is a plain
readonly one, mutated in place, that reports by calling `scope.update` itself.
There is no assignment to intercept and the array keeps its identity, so the only
honest signal for it is "something in here moved" — refreshed when the framework
says the scope changed.

That refresh compares before it reports, element by element, because
`forceUpdate` fires for anything in the scope and most of it has nothing to do
with the list. Without the comparison, a clock ticking beside a thousand rows
rebuilt all thousand every second.

Reading such a field in a view needs a spread, because `<For>` wants an array:

```tsx
<For each={[...props.scope.items]}>{(item) => <ViewSlot scope={item} />}</For>
```

`<For>` keys on each item's own reference, so a row that survives the change
keeps its DOM and whatever state it held.

**The root.** Every other scope is bound by the slot that draws it; the one at
the top has no slot above it:

```tsx
render(() => <MainView scope={bindScope(presenter.scope)} />, root)
```

## The instrumentation is global

`Observable` has one, for the whole process. The view registries are per binding
— each built through `createViewRegistry` under a symbol of its own, so one scope
class can carry a React view and an Angular view at once — but the accessors on
that class cannot be two things at the same time.

In practice this means a page renders with one binding. That is what a page does
anyway; it is written down here because the registries suggest otherwise.

## What it buys

Toggling one item in a list of a thousand, in the tutorial's stress mode, script
time per toggle:

| renderer | |
| --- | ---: |
| React | 1.67 ms |
| Angular | 0.96 ms |
| Solid | 0.22 ms |
| custom elements | 0.10 ms |

One machine and a tutorial, so read the ordering rather than the digits. React
re-runs the component and diffs a thousand rows to discover which one moved;
Solid was told by the signal that moved. The full numbers, and why total task
time is far closer than this, are in
[renderer-solid](../../apps/cube-tutorial/renderer-solid/README.md).

## Building it

```bash
pnpm compile        # from the workspace root
pnpm test
```
