# wdc-cube-webc

Custom-element bindings for the [Cube architecture](../../docs/architecture.md),
with no framework underneath.

The architecture document states the view boundary as two obligations. This
package is those two, and nothing else:

| Obligation | Here |
| --- | --- |
| Answer `scope.forceUpdate()` | `CubeElement` |
| Resolve a scope to a view | `ViewFactory` + `CubeViewSlot` |

Everything above that line — places, intents, presenters, scopes, actions,
services — comes from [`wdc-cube`](../cube/README.md) and is shared with any
other view technology. There is no dependency below it either: the platform is
the whole runtime, so what a view costs is what the DOM costs.

## A view is a custom element

```ts
export class ItemView extends CubeElement<ItemScope> {
    private label!: HTMLLabelElement
    private checkbox!: HTMLInputElement

    protected declare(dom: Dom): void {
        dom.li((row) => {
            this.checkbox = dom.input((input) => {
                input.type = 'checkbox'
                input.addEventListener('change', () =>
                    this.safeAction('onToggle', () => this.scope.actions.onToggle())
                )
            })
            this.label = dom.label()
        })
    }

    protected override onUpdate(): void {
        this.setText(this.label, this.scope.title)
        this.setChecked(this.checkbox, this.scope.completed)
    }
}
```

The split is the whole idea: **`declare` runs once and says what exists;
`onUpdate` runs on every redraw and says what changed.** A view builds its tree a
single time and afterwards only writes over it, so there is no diff, no
reconciliation and no second representation of the DOM in memory.

React and Angular do not make that split — they re-run and then work out the
difference. [`wdc-cube-solid`](../cube-solid/README.md) does, and gets a compiler
to write it: the same targeted updates, from declarative source.

Assigning `element.scope` is what binds the two — it points the scope's
`forceUpdate` at the element and redraws it. `CubeViewSlot` does that for you.

### Writing, and not writing

`onUpdate` runs on every redraw of every view above it, so most of what it does
is write a value that is already there. The `setX` helpers compare first:

| | |
| --- | --- |
| `setText`, `setValue`, `setChecked` | compare, then write |
| `setClass`, `setVisible` | compare, then toggle |
| `setAttr(el, name, value)` | compares `getAttribute` |
| `setAttrByToken(el, name, token, value)` | compares a token you supply |

The last one is for an attribute whose value is long and whose reason for
changing is short — a path, an inline style built from a theme token. Comparing
the value means serialising it; comparing the token that decided it does not.
Over 200 000 unchanged writes of a 1 320-character value, by token is 1.6 ms
against 103.5 ms.

### Actions are declared, and guarded

A view declares its actions as fields and references them where they are wired:

```ts
private readonly onToggle = this.action('onToggle', () => this.scope.actions.onToggle())
// ...
input.addEventListener('change', this.onToggle)
```

`action(context, run)` hands back a listener that runs `run` through the guard.
The guard is not a convenience: a DOM listener is not called by the framework, so
a throw inside one — or a rejected promise from an async action — lands on
`window`, where nothing reports it and the user sees a control that silently did
nothing. Because `action` is the only ergonomic way to build a listener, the
guard stops being something to remember, and a view's actions become a list you
can read at the top of the class, each with the name it reports under.

For an action that needs something only the declaration knows — the row it was
put on — the field becomes a factory that takes it:

```ts
private readonly onItemClicked = (row: SideNavItem) =>
    this.action('onItemClicked', () => this.scope.onItemClicked(this.siteOf(row)))
// ...
row.addEventListener('click', this.onItemClicked(row))
```

`safeAction` is the same guard as a free function, for a widget that owns a
listener of its own; `onActionError(handler)` decides what a failure does.

## Declaring a tree

`Dom` gives the source the shape of the tree. Every container takes a function,
and whatever is declared inside that function becomes its children — so nesting
is nesting, and no intermediate variable exists just to say what belongs to
what. Each declaration returns its element, so a view captures what it will later
change as it declares it.

```ts
Dom.render(root, (dom) => { ... })
```

`root` is an element **or a shadow root**, which is what lets a widget that owns
its own box build its inside the same way a view builds its own.

A subclass can add factory methods of its own — `dom.actionButton(...)` reading
beside `dom.div(...)` — by overriding `create` and, in a view, `createDom`. The
tutorial's `AppDom` does this for every widget the application has.

## Rendering a slot

```ts
ViewFactory.define('v-item', ItemScope, ItemView)

this.slot = new CubeViewSlot(dom.div())
this.slot.setScope(this.scope.body)   // in onUpdate
```

Two registries are involved and only one of them is ours: `customElements`
already maps a tag to a class, so `define` adds the half the browser cannot know
— which scope that tag is for. The slot then looks up the tag, creates the
element, hands it the scope and puts it in.

A view element is a real element in the tree, named after what it draws, which
makes the running page legible in a way a component tree is not. Give the
non-shell ones `display: contents` and they cost nothing in layout.

## Lists keep their rows

```ts
private readonly rows = new SyncedRows<SiteItemType, HTMLLIElement>({
    key: (site) => site.id,
    create: () => this.newRow(),
    assign: (row, site) => this.setText(row, site.site)
})
```

Rebuilding a list on every update is the obvious thing, and reusing rows by
position is the subtly wrong one: take an item out of the middle and every row
below is handed a different item than it had. Nothing looks broken — the list
reads correctly a frame later — but whatever a row was holding moves with the
position rather than with the item.

So `SyncedRows` matches by key. `key` is required and has no default, because
getting it wrong is invisible. A scope usually is its own identity, so
`(scope) => scope`; data fetched from a service usually is not, so key on the id.

## Registries do not collide

Each binding package builds its own registry through `createViewRegistry` in
`wdc-cube`. The mechanism is shared; the symbol under which the view is stored is
not. The same scope class can therefore carry a React view, an Angular view and a
custom element at the same time, which is what lets one core drive all three.

## Building it

```bash
pnpm compile        # from the workspace root
pnpm test
```
