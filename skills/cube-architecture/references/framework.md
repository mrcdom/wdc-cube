# The framework, piece by piece

A summary of `wdc-cube/docs/architecture.md` and of the `libs/*` READMEs, with what matters
for writing code. When in doubt, the source is `libs/cube/src/impl` and `Cube.test.ts`.

## Contents

1. Packages
2. tsconfig
3. Navigation and lifecycle
4. Intent: parameters and attributes
5. Slots
6. Scopes and the update pipeline
7. Collections: `ObservableArray` and hints
8. Actions
9. Services
10. The address: `HistoryManager` and codec
11. View bindings
12. Tests

---

## 1. Packages

Published on the public JavaScript package registry and installed with the project's
package manager. Check which one in the `packageManager` field of `package.json` and in the
lockfile; `wdc-cube` itself uses **pnpm** (via `corepack`). Installing with another manager
ignores the lockfile and breaks the workspace.

| Package | What it has |
|---|---|
| `wdc-cube` | places, intents, presenters, scopes, actions, update, services, history. No view |
| `wdc-cube/codec` | address codec (AES-SIV + deflate). Optional peers `@noble/ciphers`, `fflate` |
| `wdc-cube-solid` | `ViewFactory`, `ViewSlot`, `bindScope`, `useSolidScopes` |
| `wdc-cube-react` | `ViewFactory`, `ViewSlot`, `FCClass`, `classToFComponent` |
| `wdc-cube-angular`, `wdc-cube-webc` | the same two duties, in Angular and custom elements |
| `wdc-cube-test` | `TestHistoryManager`, `settle`, `presenterOf`, `ScopeUpdateRecorder` |

The boundary with the view has only two duties: answer `scope.forceUpdate()` and resolve
scope → component. A second view technology is a second binding package, not a second
framework.

**A new optional peer splits `wdc-cube` into two copies.** pnpm resolves per set of
peers: if only the presentation declares `@noble/ciphers`, it points to one copy and the
renderer to another. Two `Scope`s, two decorator registries, and the bridge stops
recognizing the scopes - the application opens blank. Give both packages the same set of
peers and check with `readlink */node_modules/wdc-cube`.

## 2. tsconfig

In the PRESENTATION layer (where the scopes are):

```jsonc
"experimentalDecorators": true,      // required: @observe and @Observable are legacy decorators
"useDefineForClassFields": false      // recommended: without it each scope costs ~3x to build
```

The renderer needs neither: a view has no decorators. In a Solid renderer, configuring a
decorator plugin in Babel BREAKS it.

## 3. Navigation and lifecycle

- `flipToIntent(intent)` is the only way to navigate. `this.flip(Places.x)` is the
  shortcut without parameters. The browser's Back arrives through the `HistoryManager` and
  takes the same path.
- `applyParameters(intent, initialization, last)`: called on each place of the path, from
  the root to the leaf. Returning `false` stops the walk.
- Commit: whoever is on the new path stays; the rest get `release()`. Rollback on failure.
- `publishParameters(intent)`: each live presenter writes what it shows. The URL is the sum.
- `this.updateHistory()`: republishes the URL from the state, without navigating. It is
  what you call after changing the state of your own place.
- `intent.redirect(place)`: a new intent for another place, copying the parameters and
  attributes of the intent at hand. Use it to redirect DURING a flip.
- `app.newFlipIntent(place)`: a new intent already filled in by the live presenters.
- `app.lastPlace`, `app.hasNavigated`: where you came from, and whether there has been a
  navigation yet (false on cold start).
- `MainPresenter extends ApplicationPresenter`: calls `this.setPlaces(Places)` in the
  constructor and `kickStart(Places.main)` at startup. `kickStart` calls the root's
  `applyParameters` with `initialization = true` and `last = true` EVEN when the address
  points somewhere deep, and then travels to the address. That is why the root, on
  initialization, rereads `historyManager.location` (the only legitimate rereading of the
  address): if the destination is not the root, it returns `false` and lets `kickStart`
  travel. Flipping itself produces TWO flips to the same address, and the second reapplies
  the opening parameters over what the reader did during the load.

## 4. Intent: parameters and attributes

| | Goes to the URL? | API | What for |
|---|---|---|---|
| Parameter | yes | `getParameterAsString/AsNumber`, `setParameter` | addressable state |
| Attribute | no | `attributes.get/set`, `getScopeSlot/setScopeSlot` | slots, data already at hand, reference to the owner |

`setParameter(name, undefined)` removes the parameter from the address. Write the default
value as `undefined`: less noise in the URL.

**Names are unique across the whole application, parameters AND attributes.** An attempt
to flip the face passes the same intent, in sequence, through every `applyParameters` from
the root to the tip. Along the way, a presenter can redirect to another face, and the
attempt can go back to the starting state (rollback, usually because of an exception). A
name repeated between two presenters makes one overwrite the other's value during that
walk, and the recomposed state comes out wrong without any error. Therefore:

- each `xxx.key.ts` declares its names in a local table, and every name starts with the
  file's two-letter prefix, unique in the application. Global uniqueness becomes a
  per-file decision, and a test that scans the keys guarantees no prefix repeats. (The
  tutorial follows this rule, with a test,
  `apps/cube-tutorial/presentation-test/src/key-names.test.ts`, that scans the keys files.)
- parameters have no exception. The only one, among attributes, is deliberate: the
  composition slots (`parentSlot`, `dialogSlot`). Each level fits into the place its
  parent gave it and takes on visual parenthood, republishing the slot under the same name
  so the next level fits where it decides. The presenter reads the slot on every
  `applyParameters` precisely because it was written by whoever is right above it, in that
  attempt.

## 5. Slots

The parent, when it is not the leaf, offers slots in the intent (`keys.parentSlot =
this.bodySlot`). It is a handing of the baton of visual parenthood: `main` offers the page
body; the shell fits into it and offers, under the SAME name, its content area; the screen
fits into that area and can offer, again under the same name, a place for what comes
below it. The child reads the slot - and any other attribute of the intent - on EVERY
`applyParameters`, and not only on `initialization`, and publishes:
`this.parentSlot = keys.parentSlot; this.parentSlot(this.scope)`. What decides the slot is
a rule in some presenter above in the composition, and the child that survives a trip
does not know whether it changed. The parent
keeps the received scope in an `@observe()` field and its view draws it with `<ViewSlot>`.

This lets a child appear in the body or in a dialog without knowing where it landed. When
the parent IS the leaf, it clears its own body slot (`this.bodySlot(undefined)`).

## 6. Scopes and the update pipeline

- `@Observable` on the class; `@observe()` on the fields the view reads. The accessor
  compares, stores and calls `scope.update(scope)`. An equal value does not trigger.
- `@Observable` returns a subclass (`ObservableXxxScope`); `instanceof` still holds.
- Actions on the scope are plain fields with a placeholder: `Scope.ASYNC_ACTION`,
  `ASYNC_ACTION_STRING/NUMBER/BOOLEAN/DATE`, `ASYNC_ACTION_ONE<T>()`, `_TWO`, `_THREE`, and
  the `SYNC_*` versions. The placeholder is a **no-op** that only logs in debug.
- A getter derived from `@observe()` fields changes along with them: a good place for a
  display rule (`get pageWindow()`), instead of a function the view calls.
- `update()` with no argument marks the presenter's root scope; `update(child)` marks a
  child.
- A single flush every ~16 ms (`CallbackManager`). `onBeforeScopeUpdate` runs before the
  flush: the place for derived state computed once, seeing all the changes.

## 7. Collections

The simplest style, and the most common: rebuild and reassign (`this.scope.rows =
items.map(buildRow)`). It dirties the parent once. It costs allocating all the children on
every change.

When N has no ceiling and the list changes little:

- `readonly items = new ObservableArray<ItemScope>(this)` - no `@observe()`; structural
  mutations (`push`, `set`, `assign`, `sort`, `removeBy*`) dirty the parent, and
  `set`/`assign` only dirty if the identity changed. It only saves anything if the
  INSTANCES are reused.
- `this.updateManager.hint(ItemScope, this.scope, 10)` - above 10 dirty items in the same
  flush, redraw the parent instead of each one. Measured: it gained nothing in React or in
  Solid in a thousand-item case; it only makes sense after reusing instances.

The order, if you ever need to optimize: first reuse instances (or `ObservableArray` with
`set`), only then `hint`. `hint` alone is dead code.

## 8. Actions

`this.action(fn)` wraps the function: it catches and reports through `unexpected()`,
updates the scope and publishes the history at the end, synchronous or asynchronous.
Building it at the binding site makes visible what is guarded and what is not.
`@action()` is the old form, and still works. `ScopeUtils.bind(scope, source)` binds in
bulk every `onSomething` to the method of the same name.

Do not guard the typing mirror (`onNameChanged`): it must not update the URL nor create
history on every keystroke. Debounce and search stay in the presenter.

## 9. Services

`SingletonServices` holds singletons with a lifecycle (`postConstruct`, `preDestroy`),
started in the `MainPresenter` (`SingletonServices.start()`). Presenters take them as plain
references (`const api = OrdersApi.INSTANCE`), and the test registers a test double or
does `vi.spyOn` on the method.

## 10. The address

- `HistoryManager.location` ALWAYS returns plain text.
- `historyManager.codec = createHistoryCodec(key)` encrypts only the QUERY; the path is
  never transformed (the guard needs to know where the reader was going).
- Install the codec BEFORE `kickStart`, which reads `location` on its first line.
  Installed later, the sealed address arrives as a meaningless parameter and the screen
  opens empty.
- Swapping the codec while the application is running: assign it and call
  `app.updateHistory()`.
- An address without an envelope is returned as it came (an old bookmark opens); an
  unreadable payload opens the place in its default state.
- The key goes in `sessionStorage`, never `localStorage`.
- Sealing does NOT replace validating on arrival, and it is not authorization.

## 11. View bindings

**Solid**: `useSolidScopes()` before any scope exists (an instrumentation file imported
first). Each field becomes a signal; the component runs once. `ViewSlot` calls
`bindScope` on entry; the root is bound by hand. The instrumentation is global: one page,
one binding.

**React**: `FCClass` + `classToFComponent`, named export. `ViewSlot` renders the view
directly, with no wrapper, passing on `className`/`style`. A controlled input loses
keystrokes: use an uncontrolled one with `onAfterRender`. `wdc-cube-react` requires
React 19.

**Registration**: `ViewFactory.register(Scope, View)` per module; each binding has its own
registry (a private symbol), so a scope can have a React view and an Angular view at the
same time. A scope with no registered view is a blank screen.

## 12. Tests (`wdc-cube-test`)

No DOM, no renderer, no mocking framework:

- `TestHistoryManager(address)` - a writable `location` to start anywhere;
  `token`/`tokens` keep every published address.
- `settle()` - drains the batch of updates, repeating while there are any; throws if it
  never settles.
- `presenterOf(app, place)` - the mounted presenter, typed, failing loudly.
- `ScopeUpdateRecorder` - counts redraws: proves "changing one item redrew one item".
- Actions swallow exceptions: wrap `unexpected` at the top so the test fails loudly.
- What it does not cover: the view and its appearance. That needs the browser.
