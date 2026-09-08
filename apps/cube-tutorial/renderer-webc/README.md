# cube-tutorial/renderer-webc

The custom-element view layer over
[cube-tutorial/presentation](../presentation/README.md), which it shares
unchanged with the React, Angular and SolidJS renderers.

Each renderer in this folder exists to show a different way of getting a scope
onto the screen:

| | how a change reaches the DOM |
| --- | --- |
| `renderer-angular` | change detection over a template language of its own |
| `renderer-react` | a virtual DOM, diffed after re-running the component |
| `renderer-solid` | fine-grained effects, placed by a compiler |
| `renderer-webc` | the same targeted writes, written by hand |

This one asks the harder question: **what is left of the view boundary when
there is no framework under it at all?** The answer is
[wdc-cube-webc](../../../libs/cube-webc/README.md) and the platform, and nothing
else — no runtime, no diff, no second copy of the DOM in memory.

## Declare once, update in place

```ts
export class ItemView extends AppElement<ItemScope> {
    private label!: HTMLLabelElement

    private readonly onEdit = this.action('onEdit', () => this.scope.actions.onEdit())

    protected declare(dom: AppDom): void {
        dom.li(() => {
            this.label = dom.label((label) => label.addEventListener('dblclick', this.onEdit))
        })
    }

    protected override onUpdate(): void {
        this.setText(this.label, this.scope.title)
    }
}
```

`declare` runs once and says what exists; `onUpdate` runs on every redraw and
says what changed. The split is the whole idea, and it is what
`renderer-solid` gets a compiler to write: the same targeted writes, from
declarative source.

The cost of doing it by hand is that every write has to compare first, which is
what the `setX` helpers are for, and that an action has to be guarded, which is
what `this.action(...)` is for. Both are the library's, and both are described in
[its README](../../../libs/cube-webc/README.md).

## Widgets are custom elements too

Every reusable piece is an element with a tag of its own, reached through a
factory on `AppDom` — `dom.panel(...)` beside `dom.div(...)`. Where
[Spectrum Web Components](https://opensource.adobe.com/spectrum-web-components/)
has the component, the widget extends it and changes only what this application
needs; where it does not, the widget is a plain custom element whose host is the
box, with its styles in a shadow root of its own.

`AppAlertDialog` is the one worth reading. Spectrum's alert dialog names
confirmation, information, warning, error, destructive and secondary — there is
no success among them, and success is one of the four `AlertSeverity` defines. So
it extends the component through the three seams the base class leaves open: the
variant setter, `renderIcon`, and the styles. Everything else — the grid, the
divider, the button group, the labelling of heading and content for assistive
technology, the tab order when the content scrolls — stays the component's.

Spectrum is the counterpart to the React app's MUI and the Angular app's Material:
each renderer pairs with a real widget library, so the comparison is not one
between a styled app and an unstyled one. The todo-mvc module stays plain HTML
and SCSS in all four, so at least one screen shows the binding with nothing else
on top of it.

## Views are elements, and the page says so

`ViewFactory.define('v-item', ItemScope, ItemView)` registers the tag with the
browser and pairs it with the scope it draws. What that buys is legibility: a
running page reads as `v-main > v-subscriptions > v-subscriptions-detail`, named
after what each one draws, in a way a component tree in a devtools panel is not.
Everything but the shell gets `display: contents`, so they cost nothing in
layout.

## Testing it

40 view tests, in the same shape as the other three renderers: a scope built by
hand, the view rendered, the DOM read back. Nothing boots a presenter — that is
settled in [presentation-test](../presentation-test/README.md), and repeating it
here would only make these fail for reasons that are not the view's. No mocks
beyond `vi.fn` on the scope's actions.

There is no rendering library to leave out. A view *is* an element, so the
harness asks the browser for it by the tag it was registered under — which makes
every test a test of that registration too:

```ts
ui = renderView('v-todo-item', anItem({ title: 'Write the tests' }))
expect(ui.text('label')).toEqual('Write the tests')
```

Some of them are particular to this renderer, because they assert what declaring
once actually buys:

- **the tree is written over, not rebuilt** — after a redraw the `li`, the
  `label` and the checkbox are the same nodes, carrying new values;
- **`setVisible` hides rather than removes** — the clear button exists from the
  first draw and only its `hidden` moves;
- **`SyncedRows` matches by key** — a row whose site is still in the list keeps
  its node even when the service hands back a fresh object for it;
- **`AppAlertDialog` really adds a variant** — `success` maps to `success`, which
  is the half of the mapping Spectrum does not have.

jsdom has no layout, so `vitest.setup.ts` supplies the observers Spectrum's Lit
components reach for. They never report anything, and nothing here depends on
them doing so.

```bash
pnpm --filter wdc-cube-tutorial-renderer-webc test
```

## Running it

```bash
pnpm install
pnpm compile          # builds the libraries and the presentation layer
pnpm start:webc       # http://localhost:3002
```

The other three run beside it, on 3000, 3001 and 3003.
