# Templates and patterns

Templates taken from `wdc-cube/apps/cube-tutorial` and from a production application. Adapt the names
to the project: first check what it calls `route-consts`, the keys base and the root presenter.

## Contents

1. Wiring: `route-consts.ts` and `routes.ts`
2. The keys base
3. A screen module, complete
4. The view (Solid and React) and the registration
5. Dialog as a place
6. CONCEPT place (sibling list and detail)
7. GUARD presenter
8. GENERIC presenter (mounted at more than one place)
9. Child presenters: segments of the view
10. Testing without a DOM
11. A list that updates in place (and the path that does not reload)

---

## 1. Wiring

```ts
// route-consts.ts - places only. Parameter and attribute NAMES do not live here.
import { Place } from 'wdc-cube'

export const Places = {
    main: Place.ROOT,
    orders: Place.UNKNOWN,
    orderDetail: Place.UNKNOWN
}
```

The names live in each `xxx.key.ts`, in a local table with the file's prefix (sections 2
and 3). A global table (`ParamIds`, `AttrIds`) looks organized, but nobody checks it
when naming, and two owners end up with the same name.

```ts
// routes.ts - the tree IS the URL: #/orders/detail?order=7
const prepare = CubeBuilder.lazyBuild({
    orders: {
        presenter: Place.creator(OrdersPresenter, Places, 'orders'),
        detail: {
            presenter: Place.creator(OrderDetailPresenter, Places, 'orderDetail')
        }
    }
})

export function initializeRoutes() {
    prepare()           // fills in the Place.UNKNOWN entries
    return Places
}
```

`Place.creator(ctor, Places, 'name')` binds the presenter to the place and stores the place in
`Places.name`. The same `ctor` can appear under two names (generic presenter).

## 2. The keys base

```ts
/** Prefix for the names in this file - unique in the application. */
const PREFIX = 'mn'

const A = {
    parentSlot: `${PREFIX}a`,
    dialogSlot: `${PREFIX}b`
} as const

export class MainKeys {
    protected _intent: FlipIntent
    protected _app: Application

    public constructor(app: Application, intent?: FlipIntent) {
        this._app = app
        // No intent: it is born from the STATE, asking each live presenter.
        this._intent = intent ?? app.newFlipIntent(this.place)
    }

    /** `await OrdersKeys.of(app).flip()` - a trip starting from the current state. */
    public static of<T extends MainKeys>(this: new (app: Application, intent?: FlipIntent) => T, app: Application): T {
        return new this(app)
    }

    public get place() { return Places.main }
    public flip() { return this._app.flipToIntent(this._intent) }

    // The slots: the only deliberate reuse of a name. Each level rewrites the SAME
    // entry so the next level fits in wherever it decides.
    public get parentSlot() { return this._intent.getScopeSlot(A.parentSlot) ?? NOOP_VOID }
    public set parentSlot(value: ScopeSlot) { this._intent.setScopeSlot(A.parentSlot, value) }

    public get dialogSlot() { return this._intent.getScopeSlot(A.dialogSlot) ?? NOOP_VOID }
    public set dialogSlot(value: ScopeSlot) { this._intent.setScopeSlot(A.dialogSlot, value) }
}
```

Keys inherit down the tree: `MainKeys` → branch keys → screen keys. A parameter is declared
once, in the owner's keys; whoever is deeper inherits it to READ it.

## 3. A screen module

```
modules/orders/
  orders.key.ts
  orders.scope.ts
  orders.presenter.ts
  index.ts            // exports scope and presenter to the renderer
```

```ts
// orders.key.ts
/** Prefix for the names in this file - unique in the application. Pick one that does not exist yet. */
const PREFIX = 'or'

/** Parameters: they go into the address. Local code unique IN THIS file. */
const P = {
    Status: `${PREFIX}a`,
    Page: `${PREFIX}b`
} as const

const STATUSES = ['open', 'paid', 'shipped'] as const
export type OrderStatus = (typeof STATUSES)[number]

export class OrdersKeys extends MainKeys {
    public override get place() { return Places.orders }

    // Guard on READ: the address is outside input.
    public get status(): OrderStatus | undefined {
        const raw = this._intent.getParameterAsString(P.Status)
        return STATUSES.includes(raw as OrderStatus) ? (raw as OrderStatus) : undefined
    }
    public set status(value: OrderStatus | undefined) {
        this._intent.setParameter(P.Status, value)
    }

    public get page(): number {
        const n = Math.trunc(this._intent.getParameterAsNumber(P.Page) ?? 1)
        return Number.isFinite(n) ? Math.min(Math.max(n, 1), 10_000) : 1
    }
    public set page(value: number) {
        // The default stays OUT of the address.
        this._intent.setParameter(P.Page, value > 1 ? value : undefined)
    }
}
```

```ts
// orders.scope.ts
@Observable
export class OrderRowScope extends Scope {
    @observe() id = 0
    @observe() customer = ''
    @observe() total = ''          // ALREADY formatted: formatting moves up into the presentation
    onOpen = Scope.ASYNC_ACTION
}

@Observable
export class OrdersScope extends Scope {
    @observe() loading = false
    @observe() error?: string
    @observe() status?: OrderStatus
    @observe() rows: OrderRowScope[] = []
    @observe() page = 1
    @observe() pageCount = 1

    onStatusChanged = Scope.ASYNC_ACTION_ONE<OrderStatus | undefined>()
    onNextPage = Scope.ASYNC_ACTION
}
```

```ts
// orders.presenter.ts
export class OrdersPresenter extends CubePresenter<MainPresenter, OrdersScope> {
    private parentSlot: ScopeSlot = NOOP_VOID
    private status?: OrderStatus
    private page = 1
    private pending = 0

    public constructor(app: MainPresenter) {
        super(app, new OrdersScope())
    }

    public override async applyParameters(intent: FlipIntent, initialization: boolean): Promise<boolean> {
        const keys = new OrdersKeys(this.app, intent)

        if (initialization) {
            this.scope.onStatusChanged = this.action(this.onStatusChanged)
            this.scope.onNextPage = this.action(this.onNextPage)
        }

        this.parentSlot = keys.parentSlot      // every trip: the slot is decided above
        this.parentSlot(this.scope)            // the screen shows up right away

        // The load runs in PARALLEL and the flip ends here. Nothing below this screen depends
        // on it; waiting would keep the trip open, and a click in the meantime would publish
        // the address of the previous place (rule 15 of the skill).
        this.show(keys.status, keys.page).catch((caught) => this.app.unexpected('Loading the orders', caught))
        return true
    }

    public override publishParameters(intent: FlipIntent): void {
        const keys = new OrdersKeys(this.app, intent)
        keys.status = this.status
        keys.page = this.page
    }

    protected async onStatusChanged(status: OrderStatus | undefined) {
        await this.show(status, 1)
        this.updateHistory()                  // same place: state + updateHistory, no flip
    }

    protected async onNextPage() {
        await this.show(this.status, this.page + 1)
        this.updateHistory()
    }

    private async show(status: OrderStatus | undefined, page: number) {
        const token = ++this.pending          // the late response of an earlier trip stays silent
        this.scope.status = status            // the request shows up immediately
        this.scope.loading = true
        try {
            const result = await api.fetchOrders(status, page)
            if (token !== this.pending) return     // lost the race: stays silent
            this.status = status
            this.page = page
            this.scope.rows = result.items.map((item) => this.buildRow(item))
            this.scope.page = page
            this.scope.pageCount = result.pageCount
        } finally {
            if (token === this.pending) this.scope.loading = false
        }
    }

    private buildRow(item: Order): OrderRowScope {
        const row = new OrderRowScope()
        row.id = item.id
        row.customer = item.customer
        row.total = formatMoney(item.total)
        row.onOpen = this.action(async () => {
            const keys = OrderDetailKeys.of(this.app)   // starts from the state: the list comes back filtered
            keys.orderId = item.id
            keys.row = item                             // attribute: does not go into the URL
            await keys.flip()
        })
        row.update = this.update                         // child scope joins the parent's cycle
        return row
    }
}
```

A child scope created by the presenter gets `row.update = this.update`; otherwise changing one
of its fields does not schedule a redraw.

## 4. The view and the registration

**Solid** (`wdc-cube-solid`): the view is a function of the scope and nothing else. Reading a
field is already reading a signal.

```tsx
export function OrdersView(props: ViewProps<OrdersScope>): JSX.Element {
    return (
        <section aria-busy={props.scope.loading}>
            <For each={props.scope.rows}>
                {(row) => <button onClick={() => void row.onOpen()}>{row.customer} · {row.total}</button>}
            </For>
            <button onClick={() => void props.scope.onNextPage()}>Next</button>
        </section>
    )
}
```

`useSolidScopes()` must run **before any scope exists** (import an
`instrumentation.ts` as the first line of `main.tsx`); calling it later throws. The root is
wired by hand: `<MainView scope={bindScope(presenter.scope)} />`. `ObservableArray` needs
a spread in `<For each={[...props.scope.items]}>`.

**React** (`wdc-cube-react`): the view is a class over `FCClass`, exported with
`classToFComponent`. Handlers stay stable without `useCallback`.

```tsx
class OrdersViewClass extends FCClass<{ scope: OrdersScope } & IViewProps> {
    private readonly onNext = () => void this.scope.onNextPage()
    render() {
        return <button onClick={this.onNext}>Next</button>
    }
}
export const OrdersView = classToFComponent(OrdersViewClass)
```

A controlled input in React loses keystrokes (the scope updates asynchronously): use `defaultValue` +
`onAfterRender` that only writes to the DOM when the two disagree.

**Registration** (any binding): per module, aggregated into a catalog called at startup.

```ts
// renderer/modules/orders/index.ts
export function registerViews(rv: typeof ViewFactory.register) {
    rv(OrdersScope, OrdersView)
}
```

The slot draws whatever is in it: `<ViewSlot scope={props.scope.body} />`.

## 5. Dialog as a place

The parent offers `dialogSlot`; the child publishes into it and **clears it on the way out**.

```ts
export class OrderDetailPresenter extends CubePresenter<MainPresenter, OrderDetailScope> {
    private dialogSlot: ScopeSlot = NOOP_VOID

    public override release() {
        this.dialogSlot(undefined)    // otherwise the dialog stays drawn after leaving the path
        super.release()
    }

    public override async applyParameters(intent: FlipIntent, initialization: boolean) {
        const keys = new OrderDetailKeys(this.app, intent)
        if (initialization) {
            this.scope.onClose = this.action(this.onClose)
        }
        this.dialogSlot = keys.dialogSlot      // every trip, like any slot
        this.dialogSlot(this.scope)
        // uses keys.row if it came from a click; fetches by keys.orderId if it came from a pasted link
        return true
    }

    protected async onClose() {
        await OrdersKeys.of(this.app).flip()   // back to the list as it was
    }
}
```

On a cold start (a link pasted straight into the dialog) there is no "where it came back from":
closing lands on the logical parent, not on `lastPlace`. The tutorial uses `this.app.hasNavigated`
to tell the two apart.

## 6. CONCEPT place

For when two sibling screens share state (list and detail need the same filter, so that
Back lands on the filtered list). The concept is the common parent, it **does not draw**, and
it is the OWNER of the parameters. List and detail stay siblings, and opening the detail does
not keep alive a list that is not showing.

```ts
export class OrdersConceptPresenter extends CubePresenter<MainPresenter, ConceptScope> {
    private at: OrdersWhere = { page: 1 }

    public override async applyParameters(intent: FlipIntent, initialization: boolean, last?: boolean) {
        const keys = new OrdersKeys(this.app, intent)
        keys.concept = this                      // attribute: the children find the owner through here
        this.at = { status: keys.status, page: keys.page }

        if (last) {
            // Stopping at the concept is not a state: go to the default composition.
            // `redirect`, not `of`: this presenter has not been committed yet.
            await this.app.flipToIntent(intent.redirect(Places.orderList))
            return false
        }
        return true
    }

    public override publishParameters(intent: FlipIntent) {
        const keys = new OrdersKeys(this.app, intent)
        keys.status = this.at.status
        keys.page = this.at.page
    }

    public moveTo(where: OrdersWhere) { this.at = where }
}
```

The list does NOT have `publishParameters` (it would be a second owner): it changes the state,
hands it back to the concept with `concept.moveTo(...)`, and only then calls `updateHistory()`.

**When to use a concept or to nest**: does the subject have a landing point? If the screens
replace each other and none of them is "the place", it is a concept and they stay siblings. If one
screen never leaves the stage (the list under the edit and confirm dialogs), it IS the landing,
it has a view, and whatever comes on top is its child.

## 7. GUARD presenter

```ts
public override async applyParameters(intent: FlipIntent, initialization: boolean, last?: boolean) {
    const keys = new HubKeys(this.app, intent)
    keys.owner = this                    // the screens inside find the guard through here

    if (!this.app.session) {
        // `of()` in the middle of the flip, and that is correct: what matters from the intent in
        // transit goes EXPLICITLY into `next`, and sign-in returns the person to the destination later.
        await SignInKeys.of(this.app).withNext(intent).flip()
        return false                     // stops the walk
    }
    if (last) {
        // The branch on its own is not a screen. Redirect WITH the intent in transit, otherwise
        // what the link brought (the company, a filter) is lost.
        await this.app.flipToIntent(intent.redirect(this.landingPlace()))
        return false
    }
    // not the leaf: take on visual parenthood and offer the slot to whoever comes inside
    keys.parentSlot = this.bodySlot
    return true
}

/** Called at the start of each screen's `applyParameters`, BEFORE any network request. */
public async allowEntry(section: Section, intent: FlipIntent): Promise<boolean> {
    if (this.allows(section)) return true
    // Refuses on behalf of the screen, mid-flip: redirects with the intent the screen passed in.
    await this.app.flipToIntent(intent.redirect(this.landingPlace()))
    return false
}

// in the screen:
if (!(await keys.owner?.allowEntry('orders', intent))) return false
```

Whatever is OUTSIDE the guarded branch is public by construction: there is no written exception.

## 8. GENERIC presenter

The same screen at two points of the tree (a detail reached from two different lists,
each one seen by a different kind of user). The framework already allows it: two places with the same `ctor` are two instances.
What it does not give you: the presenter does not receive its own place, and `applyParameters` receives the
DESTINATION intent. That is why:

1. **The generic module declares the contract and imports no mount at all.**

```ts
export interface DetailKeys { recordId: Id | undefined; parentSlot: ScopeSlot }

export type DetailMount = {
    readonly section: string
    keys(app: MainPresenter, intent: FlipIntent): DetailKeys
    back(app: MainPresenter): Promise<void>
}

export abstract class DetailPresenter extends CubePresenter<MainPresenter, DetailScope> {
    protected abstract get mount(): DetailMount     // GETTER: exists before the base constructor
}
```

2. **Each mount lives in the folder of whoever hosts it** (`<list>/detail/`), extends the base
   and returns the descriptor from the getter.
3. **Each mount's keys extend the list's keys and prove the contract with
   `implements`.** Removing a parameter from a mount breaks the build.

`mount` is an abstract getter, never a field or a factory: a subclass field only exists after the
base constructor (`undefined` inside it), and a factory that reads a subclass field freezes
`undefined` forever.

The rule that keeps this valid: **no mount may be an ancestor of the other**. Being exclusive,
only one is alive, and both can publish the same names without creating two owners - the name
belongs to the CLASS that publishes it.

## 9. Child presenters: segments of the view

The cube composes the skeleton (the places). Inside the view of a presenter that is on a face,
each visual segment can have its own presenter: a tab, a panel stacked on
demand, a selector. The child always has at least one scope - looking after a segment is
why it exists - and the one who governs it is the OWNER:

- the owner creates, keeps and releases the child, calling its `release`;
- the owner delegates to the child its share of `applyParameters` and `publishParameters`;
- which child is active, and in what order, is a PARAMETER of the owner. It never becomes a path:
  switching tabs or opening a panel does not switch faces.

The framework has no ready-made support for this. The contract below is written in the project.

### 9.1 The child's contract

```ts
/** What a segment's presenter offers its owner. */
export interface SegmentPresenter<S extends Scope, K> {
    readonly scope: S
    /** Establishes or re-establishes the segment's state from the intent. */
    applyParameters(keys: K, initialization: boolean): Promise<void>
    /** Writes the segment's minimal identity. */
    publishParameters(keys: K): void
    /** Releases whatever needs special handling (timer, subscription, request). */
    release(): void
}
```

- The child receives the **owner's keys**, not a raw intent. The segment's parameters are
  declared in that keys' local table, with its prefix. For the "one name, one owner" rule,
  the one who publishes is the owner: the child only fills in its own part.
- The child receives the owner's `update` (`scope.update = update`) and runs in the same redraw
  cycle.
- If the same kind of segment can appear twice at the same time, its parameters
  need a discriminator (the instance id in the name, or a composite parameter), otherwise
  both instances write to the same name.

### 9.2 Tabs: one child per tab

```ts
type Tab = 'summary' | 'items' | 'history'

export class OrderPresenter extends CubePresenter<MainPresenter, OrderScope> {
    private readonly tabs = new Map<Tab, SegmentPresenter<Scope, OrderKeys>>()
    private active: Tab = 'summary'

    public override async applyParameters(intent: FlipIntent, initialization: boolean) {
        const keys = new OrderKeys(this.app, intent)
        if (initialization) {
            this.scope.onSelectTab = this.action(this.onSelectTab)
        }
        this.parentSlot = keys.parentSlot
        this.parentSlot(this.scope)

        await this.activate(keys.tab, keys)          // `tab` is a parameter of the owner, guarded
        return true
    }

    public override publishParameters(intent: FlipIntent) {
        const keys = new OrderKeys(this.app, intent)
        keys.tab = this.active
        this.tabs.get(this.active)?.publishParameters(keys)
    }

    public override release() {
        for (const tab of this.tabs.values()) tab.release()
        this.tabs.clear()
        super.release()
    }

    protected async onSelectTab(tab: Tab) {
        await this.activate(tab, OrderKeys.of(this.app))   // same place: no flip
        this.updateHistory()                               // the identity changed
    }

    private async activate(tab: Tab, keys: OrderKeys) {
        let presenter = this.tabs.get(tab)
        const created = !presenter
        if (!presenter) {
            presenter = this.createTab(tab)                 // new ItemsTabPresenter(this.app, this.update)
            this.tabs.set(tab, presenter)
        }

        // "One alive at a time" policy. For "all alive", simply do not release.
        for (const [id, other] of this.tabs) {
            if (id !== tab) {
                other.release()
                this.tabs.delete(id)
            }
        }

        this.active = tab
        await presenter.applyParameters(keys, created)
        this.scope.activeTab = tab
        this.scope.tabBody = presenter.scope               // the view draws it with <ViewSlot>
    }
}
```

The choice between keeping one tab alive at a time or all of them belongs to the owner, and it changes two things:

- **memory and network** - all alive preserves each tab's state when you come back to it, at the cost
  of keeping everything loaded;
- **identity** - with all alive, decide whether only the active one publishes (an F5 rebuilds the
  open tab, and the others go back to the default) or whether all of them publish (the F5 rebuilds each tab as
  it was). It is the same quality criterion that decides any transient state.

### 9.3 Segments stacked on demand

Panels opened one on top of the other, in order, as the reader asks for them. The owner keeps the LIST
of instantiated children, and the identity is which ones are open and in what order.

```ts
// ?panels=sales,stock,returns
private stack: { id: PanelId; presenter: SegmentPresenter<PanelScope, DashKeys> }[] = []

private async arrange(wanted: PanelId[], keys: DashKeys) {
    // Release the ones that left.
    for (const item of this.stack) {
        if (!wanted.includes(item.id)) item.presenter.release()
    }

    // Reuse the ones that stayed, create the ones that came in, in the requested order.
    const next = wanted.map((id) => {
        const kept = this.stack.find((item) => item.id === id)
        return { id, presenter: kept?.presenter ?? this.createPanel(id), created: !kept }
    })
    this.stack = next.map(({ id, presenter }) => ({ id, presenter }))

    for (const item of next) await item.presenter.applyParameters(keys, item.created)
    this.scope.panels = this.stack.map((item) => item.presenter.scope)
}

public override publishParameters(intent: FlipIntent) {
    const keys = new DashKeys(this.app, intent)
    keys.panels = this.stack.map((item) => item.id)     // which ones and in what order
    for (const item of this.stack) item.presenter.publishParameters(keys)
}
```

The list that arrives through the URL goes through a guard in the keys like any parameter: only known
ids, no repeats (or with a discriminator, if repeating is allowed), with a cap.

### 9.4 The minimal form: a component with no identity of its own

When all of the segment's state derives from the owner, the child does not even need the full contract:
it receives the `update`, exposes the scope, and notifies the owner through a callback. This is the case for selectors
hosted by several screens (`components/`).

```ts
export class PeriodSelectorPresenter {
    public readonly scope = new PeriodScope()

    public constructor(update: (scope?: Scope) => void, private readonly onChange: (p: Period) => Promise<void>) {
        this.scope.update = update                       // runs in the cycle of whoever hosts it
        this.scope.onPick = async (p) => this.onChange(p)
    }

    public show(period: Period) { this.scope.label = describe(period) }
}

// in the owner
private readonly period = new PeriodSelectorPresenter(this.update, async (p) => {
    this.period.show(p)
    await this.apply(p)
})
// in initialization, ONCE:
this.scope.period = this.period.scope
```

The period is the OWNER's state: it reads it in `applyParameters`, publishes it in
`publishParameters` and calls `show()` for the selector to draw. If the selector ever gains
state of its own that must survive an F5, it moves on to implementing the contract from 9.1.

Two precautions that apply to any child:

- Hand the child's scope to the owner once per instance. Reassigning it on every redraw is
  writing to an `@observe()` inside the update cycle that very write triggered - in Solid
  this has already brought the screen down with `Maximum call stack size exceeded`. For the same reason, `show()`
  with what is already on screen must be a no-op.
- Do not call it "panel": the panel is the visualization; the class is `XxxPresenter` and the view `v-xxx`.

**Where it lives:** a general-purpose child, hosted by several screens, goes in `components/`;
a child dedicated to one module (the tabs in 9.2, the panels in 9.3) goes in the module's folder.

## 10. Testing without a DOM

```ts
const history = new TestHistoryManager('/orders?status=paid&page=2')   // cold start
const app = new MainPresenter(history)
await app.kickStart(Places.main)
await settle()

const scope = app.scope.body as OrdersScope
expect(scope.rows).toHaveLength(3)

await scope.rows[0].onOpen()
await settle()
expect(history.token).toContain('/orders/detail')
expect(history.token).toContain('status=paid')     // the list traveled along
```

- `presenterOf(app, place)` gives the mounted presenter, typed, failing loudly if there is none.
- Actions swallow exceptions: wrap the app's `unexpected` in the setup so the test fails loudly.
- Browser storage is not the DOM: a `localStorage` test double on `globalThis` makes
  what the presentation remembers testable.
- With a codec, `history.token` stays readable; `encodedToken` is what traveled.

## 11. A list that updates in place (and the path that does not reload)

The view binds to the scope OBJECT (see "The identity of what is on screen" in SKILL.md).
A list that builds new rows on every load makes the view redo all of them, and the screen
flickers. The fix has two halves: reuse the row with the same identity, and do not
reload when nothing changed.

### 11.1 The utility

```ts
/** Reuses, for each item, the row with the SAME identity that is already on screen. */
export function reuseRows<Row extends { identity?: unknown }, Item>(
    current: readonly Row[] | undefined,
    items: readonly Item[],
    keyOf: (item: Item) => unknown,
    build: (item: Item, reuse: Row | undefined) => Row
): Row[] {
    const before = new Map<string, Row>()
    for (const row of current ?? []) {
        before.set(String(row.identity), row)
    }
    return items.map((item) => build(item, before.get(String(keyOf(item)))))
}
```

It lives in a shared place in the presentation (it belongs to no screen), and it imports nothing from the
framework: it only needs each row's `identity`.

### 11.2 The builder receives the old row

```ts
// in the presenter
this.scope.rows = reuseRows(this.scope.rows, orders, (order) => order.id, (order, reuse) =>
    this.rowOf(order, reuse)
)

private rowOf(order: Order, reuse?: OrderRowScope): OrderRowScope {
    const scope = reuse ?? new OrderRowScope()
    scope.identity = order.id
    scope.customer = order.customer           // ALL fields, always
    scope.total = formatMoney(order.total)
    scope.onOpen = this.action(this.onOpen.bind(this, order.id))
    scope.update = this.update
    return scope
}
```

Three precautions, and all three break silently:

- **Every field is rewritten.** A field that the builder only fills in "when there is one" keeps the
  value from the previous load. Reset to empty before filling in:

  ```ts
  function cellOf(item: Item, columnId: number, reuse?: CellScope): CellScope {
      const scope = reuse ?? new CellScope()
      scope.identity = columnId
      scope.value = '-'                 // empty FIRST
      scope.statusColor = undefined
      const found = item.values.find((value) => value.columnId === columnId)
      if (found) {
          scope.value = format(found)
          scope.statusColor = toneOf(found)
      }
      return scope
  }
  ```

- **Nested scopes are reused too.** The cells of a reused row are
  looked up in the old row by their own identity (`reuse?.cells.find(...)`). Recreating only
  the cells keeps the row and still redraws its whole content.
- **Two rows of different kinds can have the same identity** (a month and the first
  day of that month, both with the same date). The field that one kind has and the other does not - an
  open action - is explicitly cleared in the builder that does not use it.

A scope that contains the list (a whole table per tab) follows the same rule: reuse
the table's scope when it is the same tab, instead of creating another one on every load.

### 11.3 The path that does not reload

```ts
private loadedFor?: string   // which context the list in hand belongs to

public override async applyParameters(intent: FlipIntent, initialization: boolean) {
    const keys = new OrdersKeys(this.app, intent)
    // ... slots, actions, parentSlot(this.scope)

    const target: Where = { tab: keys.tab, customerId: keys.customerId }

    // The SAME context as the list in hand: just follow what changed in the address. Opening and
    // closing a child dialog goes through here, and reloading would make the list flicker.
    if (this.loadedFor === String(target.customerId ?? '')) {
        this.at = target
        this.showTab(target)
        return true
    }

    void this.moveTo(target)   // load in parallel, with a token (rule 15)
    return true
}

private async moveTo(target: Where) {
    this.at = target
    this.loadedFor = undefined               // until the response arrives, there is no valid list
    const token = ++this.pending
    const orders = await api.fetchOrders(target.customerId)
    if (token !== this.pending) return
    this.loadedFor = String(target.customerId ?? '')
    this.scope.rows = reuseRows(this.scope.rows, orders, (o) => o.id, (o, reuse) => this.rowOf(o, reuse))
}

/** Whoever CHANGED the data gives notice. The edit dialog calls it after saving. */
public async refresh() {
    await this.moveTo(this.at)
}
```

In the child dialog, **cancel does not notify** - it only closes. Save notifies and then closes.

### 11.4 In the view: "loading" does not cover a quick reload

Even with the rows in place, a "loading" veil drawn on every load flickers over
them. It shows up only if the load goes past a threshold (a few hundred milliseconds),
and in the theme's surface color, not in a fixed color. This belongs to the view, not to the presentation:
the scope says `loading`, and the view decides how and when to show it.
