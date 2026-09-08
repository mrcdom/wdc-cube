# cube-tutorial/renderer-solid

The SolidJS view layer over
[cube-tutorial/presentation](../presentation/README.md), which it shares
unchanged with the React, Angular and custom-element renderers.

Each renderer in this folder exists to show a different way of getting a scope
onto the screen:

| | how a change reaches the DOM |
| --- | --- |
| `renderer-angular` | change detection over a template language of its own |
| `renderer-react` | a virtual DOM, diffed after re-running the component |
| `renderer-solid` | fine-grained effects, placed by a compiler |
| `renderer-webc` | the same targeted writes, written by hand |

Solid is often described as compile-time reactivity. That is not quite it: the
reactivity is signals at runtime, and what the compiler does is **place** the
subscriptions — the JSX becomes direct DOM construction plus an effect attached
to one attribute or one text node. A component body runs **once**, for the life
of the component, and never again.

Which makes this renderer the interesting neighbour of `renderer-webc`: the two
produce the same kind of update, one from a compiler and one from a person.

## Nothing in a view knows about a signal

```tsx
export function ItemView(props: ViewProps<ItemScope>): JSX.Element {
    return (
        <li classList={{ [Css.completed]: props.scope.completed }}>
            <label onDblClick={() => props.scope.actions.onEdit()}>{props.scope.title}</label>
        </li>
    )
}
```

`props.scope.title` is a plain field read, and Solid subscribes to that field
alone. Changing the title updates one text node; the `classList` above it is not
even re-examined.

That works because of [wdc-cube-solid](../../../libs/cube-solid/README.md), which
takes over the instrumentation of scopes: where the framework's default installs
one accessor that marks the whole scope, Solid's installs one that also carries a
signal per field. Views are written as if the scope were plain data, because from
where they stand it is.

The only thing the views do differently is `[...scope.items]` when reading an
`ObservableArray`, and even that is only because it is not an `@observe()` field —
the reason is in the library's README.

## What it costs

Stress mode builds 1000 items and a clock. Toggling one of those items, 40 times,
measured through Chrome's `Performance.getMetrics`:

| renderer | script time per toggle |
| --- | ---: |
| `renderer-react` | 1.67 ms |
| `renderer-angular` | 0.96 ms |
| `renderer-solid` | 0.22 ms |
| `renderer-webc` | 0.10 ms |

One machine, one afternoon, and a tutorial rather than an application — so read
the ordering, not the digits. The ordering is the point: React re-runs the
component and diffs a thousand rows to discover that one changed; Solid was told
which one by the signal that changed. The custom-element renderer is lower still
because nothing had to be discovered at all.

Total task time is far closer between the four — around 5 ms per toggle
everywhere — because event dispatch, style and layout dominate, and those are the
browser's work rather than the renderer's. The difference is in the deciding.

## Running it

```bash
pnpm install
pnpm compile          # builds the libraries and the presentation layer
pnpm start:solid      # http://localhost:3003
```

The other three run beside it, on 3000, 3001 and 3002.
