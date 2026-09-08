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

## The widgets

[Kobalte](https://kobalte.dev) rather than a Material port. Solid's own
ecosystem answers with headless primitives, and the one live option among them
is written *in* Solid, on signals — where Ark UI keeps widget state in
framework-agnostic machines that sit beside the reactivity rather than in it. In
a project whose subject is that reactivity, that difference decides.

`@suid/material` would have matched the React app's look, and was the obvious
candidate for it. It was last published in June 2025 and targets MUI v5 while
`renderer-react` runs v9 — so it would not have matched anyway.

Headless means the styling here is this app's own, and it does not look like
Material. What the library brings is behaviour, and it is behaviour the
hand-written version did not have: focus trapped inside an open dialog and given
back on close, Escape and a click outside arriving at the same `onOpenChange` so
the presenter hears one thing, the page behind marked `aria-hidden`, and a label
tied to its input without an id invented in the view and kept in step by hand.

One thing it cannot do from here: restore focus to whatever opened the dialog. A
Kobalte dialog learns that from its own `Dialog.Trigger`, and these open because
a presenter put a scope in a slot — there is no trigger to remember.

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

## Testing it

39 view tests, in the same shape as the React and Angular ones: a scope built by
hand, the view rendered, the DOM read back. Nothing boots a presenter — that is
settled in [presentation-test](../presentation-test/README.md), and repeating it
here would only make these fail for reasons that are not the view's. No mocks
beyond `vi.fn` on the scope's actions, and no rendering library: plain
`solid-js/web`, because one more layer between the assertion and the markup is
one more thing that can be right when the view is wrong.

Two of them are particular to this renderer, and assert node **identity** rather
than content:

```ts
ui.act(() => (scope.title = 'Another title'))

expect(ui.get('label')).toBe(label)          // the same node, re-texted
expect(ui.get('input.toggle')).toBe(toggle)  // untouched
```

Which is the claim of the whole renderer, made checkable. All 39 were verified
against injected defects — a filter mark that stops following the scope, a caret
that stops going to the end, and a heading rebuilt on every change — and each
turned red for the right reason.

```bash
pnpm --filter wdc-cube-tutorial-renderer-solid test
```

## Running it

```bash
pnpm install
pnpm compile          # builds the libraries and the presentation layer
pnpm start:solid      # http://localhost:3003
```

The other three run beside it, on 3000, 3001 and 3002.
