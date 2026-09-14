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

## The address, and changing what travels in it

Everything above assumes the query string in the address bar *is* the state:
`publishParameters` writes it, `applyParameters` reads it. For most
applications that is the whole story, and nothing here applies.

Some cannot leave it legible. An address that carries a person's identifier is
also in the browser's history, in a screenshot, in a `Referer` header, and in a
server log. `HistoryCodec` is an opt-in seam for changing the form the query
travels in — encrypting it, compressing it, shortening it — and Cube implements
none of them:

```ts
export interface HistoryCodec {
    readonly envelope: string
    encode(queryString: string): string | undefined
    decode(payload: string): string | undefined
}
```

An application installs one on its history manager and changes nothing else:

```ts
const historyManager = new PageHistoryManager(true)
historyManager.codec = createHistoryCodec(keyFromSignIn)
```

### Only the query, and only on the wire

The **path is never transformed**. A place has to be resolved before any key
exists — a guard needs to know where the reader was going in order to send them
to the door and back — and a readable link is half of what an addressable URL is
for.

And `historyManager.location` **always returns plain text**. That is the rule
the whole seam turns on rather than a convenience: four places read it, and one
of them decides *"did the address change?"* by comparing strings. A codec is
allowed to be non-deterministic — a real AEAD with a random nonce produces a
different envelope for the same state every time — so ciphertext there would
compare unequal to itself and put the application in a navigation loop. The
write path compares plain against plain for the same reason.

Nothing above the history manager knows a codec exists. `FlipIntent`,
`Application`, every presenter and every keys class are untouched.

### An address without an envelope keeps working

A codec names one parameter, and a query that does not carry it is handed back
as it came. That is what makes adoption an address at a time rather than a
migration: a bookmark saved before the codec existed still opens. A payload that
cannot be read — wrong key, altered, a version this build no longer accepts —
opens the place in its default state.

### Testing an application that uses one

`TestHistoryManager.token` stays plain, so assertions stay readable.
`encodedToken` exposes what travelled, which is where a codec's only claim can
be tested:

```ts
expect(history.token).toBe('todos?state=todo')
expect(history.encodedToken).not.toContain('state=todo')
```

### The reference implementation, and where to press it

`wdc-cube/codec` is a working one: AES-SIV over the query, conditional deflate,
base64url on the wire, in an envelope carrying a version byte and a flags byte.

It is a **subpath with optional peer dependencies** rather than part of the main
entry point, and that shape is the whole argument. The seam and an
implementation of it are different things: an application that never seals an
address should not download a cipher to prove it. So `@noble/ciphers` and
`fflate` are declared optional and the application that wants them declares them
itself — which also means it picks the versions.

It shipped this way rather than as a file to copy because a copied file is a
silent fork: a fix to the envelope packing does not reach it, its tests protect
only the copy they came with, and the next application writes the same thing
slightly differently. That is the argument `verify/run.mjs` already makes about
packaging, applied to content.

The showcase is where it is **pressed** rather than where it lives.

And it is not merely installed there — there is a switch for it in the sidebar.
An opt-in seam nobody can see is a seam nobody believes, so the showcase lets a
reader turn it on, watch the query become one opaque parameter, navigate, press
Back, and turn it off again. That switch is also the only thing that exercises
swapping a codec on a running application.

Two things that switch taught, both of which needed a browser rather than a
test:

**Changing the codec has to republish the address**, and the framework has to
notice that the *form* changed even when the state did not. It cannot do that by
comparing one envelope with another — a codec may seal the same state
differently every time — so it asks whether there *is* an envelope, which is
stable either way.

**The key has to be in place before the address is read.** `kickStart` reads
`historyManager.location` on its first line, so a codec installed later is
installed too late: a sealed address arrives as one meaningless parameter and
the place opens with nothing, which is exactly what a link whose key has since
rotated looks like. The showcase mirrors its switch in `sessionStorage` and
installs the codec in the presenter's constructor. A real application does the
same with the key itself — `sessionStorage`, never `localStorage`, which
outlives the browser and on a shared machine hands the next person the key.

Three things it demonstrates that are worth knowing before writing another:

**Deterministic, and not by fixing a nonce.** Two requirements get confused.
*Durability* — an address produced today still opens in six months — needs only
a stable key, and a random nonce satisfies it. *Stability* — the same state
always produces the same address — is what needs determinism. Fixing the nonce
of plain AES-GCM to get it would be catastrophic: GCM is a stream cipher, so two
messages under one nonce give `C1 XOR C2 = P1 XOR P2`, and addresses are nearly
identical to one another. AES-SIV derives its tag from the plaintext, which is
what makes repetition safe. What determinism leaks is **equality**: a reader of
the history can tell someone returned to the same state, without knowing which.

**Compression usually makes it bigger.** base64url charges 33% for the trip, so
deflate has to save more than a quarter to break even, and in the first hundred
bytes it has nothing to refer back to. `page=2` deflates from 6 bytes to 8. The
turning point is near 200 characters, so the codec decides per address and a
flag says what it did.

**A key in the bundle is obfuscation, not secrecy.** Whoever downloads the
application has it. It still buys an address that is not casually readable over
a shoulder or in a synced history, and it keeps links shareable. A real
deployment derives a key per user on a server and hands it over at sign-in; the
interface does not change.

**And none of it replaces validating on arrival.** A legitimate link from three
months ago can carry `page=999999` for a list that has since shrunk. Encryption
proves an address came from the application; it does not make its contents true.

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
[cube-tutorial/renderer-react](../apps/cube-tutorial/renderer-react) holds the
views. There are now four of those — React, Angular, custom elements and SolidJS
— and each was added with the presentation layer untouched.

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
