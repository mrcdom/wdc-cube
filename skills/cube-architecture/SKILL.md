---
name: cube-architecture
description: How to write, change, review and debug code in the Cube architecture (packages `wdc-cube`, `wdc-cube-solid`, `wdc-cube-react`, `wdc-cube-angular`, `wdc-cube-webc`, `wdc-cube-test`) - places, FlipIntent, presenters, scopes, keys classes, slots and the address derived from state. Use ALWAYS when the project depends on any `wdc-cube*` package, or when the task touches `*.presenter.ts`, `*.scope.ts`, `*.key.ts`, `route-consts.ts`/`RouteConsts.ts`, `routes.ts`/`Routes.ts`, `applyParameters`, `publishParameters`, `ScopeSlot`, `@Observable`/`@observe` or `ViewFactory.register` - including "create a screen", "add a filter to the URL", "open a dialog", "take the user from one screen to another", "review this presenter" or investigating a "blank screen", "button that does nothing", "X is not a function", "parameter showing up in the wrong URL", "screen that freezes".
---

# Cube architecture

## The concept: a cube of possible faces

Architectures such as Redux, XState and Zustand treat application state as a separate
structure: a store receives events through a `dispatch` and is rewritten on each one. They
differ in the helpers they offer for dispatching events, but share the premise: the next
state is an unknown that depends on the event fired.

Cube starts somewhere else.

**Two kinds of state, each with an owner.** RENDERING state is the **scope** (`Scope`):
what the view draws. CONTROL state is the remaining fields of the **presenter**
(`Presenter`): what it needs to know in order to decide. Both are mutable and segmented by
presenter, which owns them. Changing a scope property is a request to redraw, as soon as
possible, the view that represents it. There is no global store and no event to
interpret: whoever changes the state is whoever owns it.

**A tree of owners.** A presenter can own other presenters. At the top is the
**application presenter** (`ApplicationPresenter`), which controls the whole application
lifecycle.

**The cube and its faces.** The application skeleton admits a set of possible compositions
of presenters, and that set is registered in the **cube** (the place tree). Each
composition is a **face** of the cube, and each face has a name: its **path**, such as
`#/orders/detail`. An **intent** (`FlipIntent`) is the request to change face, that is,
to bring the structural state of the application to one of the possible faces, with the
parameters it needs.

**The contract of whoever takes part in a face.** Every presenter that makes up a face
implements three methods:

| Method              | Responsibility                                                                         |
| ------------------- | -------------------------------------------------------------------------------------- |
| `applyParameters`   | Accept (or refuse) the new state, and RECOVER the state from the intent's parameters   |
| `publishParameters` | Publish the MINIMAL identification of the state, the one that is enough to recreate it |
| `release`           | Release whatever needs special handling when the presenter leaves the face             |

**The identity of the state.** The sum of what the presenters publish is the identity of
the application state, and it lives in the URL. Whenever the state changes in a way that
changes its identification, the identity has to be updated (`updateHistory()`). This
discipline is what makes an F5, a pasted link or Back put the application back exactly as
it was: `applyParameters` reads the intent that came from the URL and rebuilds the
previous state.

**The identity of what is on screen.** There is a second identity, and it does not live in
the URL: it lives in the scope objects. The view binds to each object - one list element
per row scope, one component per panel scope. That is why the two operations on a scope
say different things to the renderer: **changing a property** asks to redraw that piece;
**replacing the object** asks to destroy it and create another in its place. The same
thing on screen - the same person in a list, the same panel - is the same object, updated
in place. Replacing it when the thing has not changed makes the screen flicker, loses
focus and scroll position, and costs a redraw of everything it drew.

The same idea applies to the face cycle: whoever stays on the path of a trip is REUSED,
and its state remains valid. Passing through a presenter is not reloading it.

**And transient state?** Recovering it is an implementation choice, case by case:

- discard it, when it was not relevant (text half-typed into a search field);
- keep it in the browser, in `sessionStorage` or `localStorage`, and read it back in
  `applyParameters` (a reader's preference, a draft);
- persist it in a remote cache and recover it in `applyParameters` (a long piece of work
  that has to survive from one device to another).

To the extent the application's quality criteria demand, it can be restored to its exact
state with nothing in hand but the intent that comes from the URL.

**Child presenters: the cube composes the skeleton, the owner composes the segments.** The
cube controls the composition of the structural skeleton: the places. Inside the view of a
presenter that is on a face, each visual SEGMENT can have its own presenter, a child of
it - a tab, a panel stacked on demand, a selector. The child only makes sense if it has at
least one scope: it exists to take care of a segment of the screen. (Scopes, in turn, can
reference other scopes that have no presenter of their own.)

Whoever governs the child is the OWNER, not the cube:

- **lifecycle** - the owner creates, keeps and releases. It can keep only the active one
  instantiated, or all of them at once; when releasing, it calls the child's `release`;
- **state and identity** - the owner delegates to the child its part of `applyParameters`
  (establishing or re-establishing state) and of `publishParameters` (the minimal
  identity);
- **which child is active, and in what order** - is a PARAMETER of the owner, never a path.
  Switching tabs does not switch faces.

The child can be a general-purpose component, hosted by several screens, or dedicated to
the module itself. The framework does not ship ready-made support for this internal
composition (it is written by hand, with the template in
[references/patterns.md](references/patterns.md)), but it is as much a part of the
architecture as the cube.

### From concept to code

| Concept                        | In the code                                                                                        |
| ------------------------------ | -------------------------------------------------------------------------------------------------- |
| Cube                           | The place tree registered with `CubeBuilder.lazyBuild` (`routes.ts`)                               |
| Face and path                  | A composition of the tree and its path; each node of the path is a `Place`                         |
| Intent                         | `FlipIntent`: path + parameters (go to the URL) + attributes (do not)                              |
| Change face                    | `flipToIntent(intent)`, or `keys.flip()`                                                           |
| Application presenter          | `ApplicationPresenter` (usually `MainPresenter`)                                                   |
| Presenter                      | `CubePresenter<App, Scope>`; the control state is its fields                                       |
| Scope                          | `Scope` with `@Observable` and `@observe()`; assigning schedules the redraw                        |
| Identity                       | what `publishParameters` writes; `updateHistory()` updates it                                      |
| Identity of what is on screen  | the scope object itself; in a list, reconciled by each row's `identity`                            |
| Where a face's child appears   | `ScopeSlot`: the function the place above hands to the one below to publish its scope              |
| Segment with its own presenter | Child presenter, created and released by the owner; its scope goes in a field of the owner's scope |
| Typed reading of the intent    | keys class (`*.key.ts`), the only one that knows the parameter names                               |

The rest of the skill is the consequence of this. Almost every defect in a Cube
application comes from breaking the contract without noticing: a state that should be in
the identity and is not, a presenter that publishes what is not its own, a scope published
in the wrong place. And almost all of them break SILENTLY: it compiles, the test passes,
and the screen does the wrong thing. That is why the rules come with the why.

## First: find your bearings in the project

Before writing, find out three things. They change from project to project.

1. **Where the presentation lives and where the view lives.** The framework's pattern is a
   `presentation/` package (places, keys, presenters, scopes, services - only `.ts`, no
   view imports) and one or more `renderer-*/` (views). Look for
   `route-consts.ts`/`RouteConsts.ts` and `routes.ts`/`Routes.ts`: that is the wiring of
   the tree.
2. **The local conventions.** Read the `CLAUDE.md`, the README of the presentation package
   and any architecture doc in the project. Mature projects add layers (encrypted address,
   code tables, URL guards) that are not in the framework.
3. **If the project documents a layer of its own on top of Cube**, read it before writing.
   It is common: short codes in place of parameter names, encrypted address, shared URL
   guards, a shell with its own API, where each kind of presenter lives. Those rules win
   over this skill's templates, and they also break silently when ignored.

The canonical framework documentation is in the `wdc-cube` repository
(github.com/mrcdom/wdc-cube): `docs/architecture.md`, the
README of each `libs/*`, and two complete examples - `apps/cube-tutorial` (the basics,
drawn in four technologies) and `apps/cube-showcase` (the real case: list with filters,
dashboard, dialogs as places). When the question is "does the framework allow X?", the
code in `libs/cube/src/impl` and `Cube.test.ts` answer it.

## Changing face: the cycle that explains almost every rule

Everything goes through `flipToIntent`. There is no router to call.

1. The application walks the path of the target face, from the root down.
2. For each place: if the presenter already exists, it is **reused** and gets
   `applyParameters(intent, initialization: false, last)`; if not, it is **constructed**
   and gets `initialization: true`. `last` is true only at the leaf.
3. A presenter that returns `false` **stops the walk** (that is how a guard is done).
4. Success: the presenters on the new path stay, **all the others are released**
   (`release()`). Failure: back to the previous state.
5. The URL is **rewritten from the live presenters**, each one answering
   `publishParameters(intent)`.

Two consequences to internalize:

- **A presenter that stays on the path survives.** That is why `applyParameters` has the
  `initialization` flag: binding actions happens once; reading parameters and the slot
  happens on every trip.
- **Identity is derived, not stored.** What a presenter does not publish disappears from
  the address on the next write. And whoever left the face stops publishing - so there is
  nothing to "clean up" when travelling.

## The skeleton of a presenter

```ts
export class XxxPresenter extends CubePresenter<MainPresenter, XxxScope> {
  private parentSlot: ScopeSlot = NOOP_VOID
  private pending = 0

  public constructor(app: MainPresenter) {
    super(app, new XxxScope())
  }

  public override async applyParameters(intent: FlipIntent, initialization: boolean, last?: boolean) {
    const keys = new XxxKeys(this.app, intent)

    if (initialization) {
      this.scope.onSave = this.action(this.onSave) // actions: ONCE, guarded
      this.scope.onNameChanged = this.handleName.bind(this) // typing mirror: no guard
    }

    this.parentSlot = keys.parentSlot // EVERY trip: attributes come from whoever is above
    this.parentSlot(this.scope) // the screen appears right away
    this.filter = keys.filter // the state that IDENTIFIES the face, read now
    this.page = keys.page
    this.load().catch((caught) => this.app.unexpected('Loading', caught)) // in parallel; the flip ends here
    return true
  }

  public override publishParameters(intent: FlipIntent) {
    const keys = new XxxKeys(this.app, intent)
    keys.filter = this.filter
    keys.page = this.page
  }
}
```

Complete templates (keys, scope, presenter, view, registration, tree) and the larger
patterns are in [references/patterns.md](references/patterns.md).

## Rules that break silently

Each one has a symptom that does not point to the cause. Read the why: it is what tells
you when the rule applies to a new case.

1. **Read the intent's attributes on EVERY call, and fill the slot before waiting on the
   network.** Slots (`parentSlot`, `dialogSlot`) and references that the level above leaves
   in the intent (the owner, the shell, the concept, data already in hand) are read OUTSIDE
   the `if (initialization)` - preferably BEFORE it, so the initialization code already
   finds them in the fields. The slot is decided by a rule of whoever is above, and a
   presenter that survives the trip has no way of knowing whether that decision changed:
   stored only at initialization, it publishes into the slot of the old composition and
   the screen disappears or appears in the wrong place. For references the risk is lower
   (a live ancestor is the same instance for as long as the child lives), but the rule is
   a single one, because re-reading costs nothing and nobody has to decide case by case.
   Then, `this.parentSlot(this.scope)` comes before the first `await`, otherwise the
   previous screen stays frozen in front during the request. The scope has `loading`
   precisely so the view can be drawn before the data.
2. **Bind actions inside `if (initialization)`, and bind all of them.** An action declared
   in the scope (`onX = Scope.ASYNC_ACTION`) and never bound is a **silent no-op**: the
   button does nothing and only a debug log records it. Binding outside `initialization`
   recreates the function on every trip.
3. **Guard the action at the binding point**: `this.scope.onSave = this.action(this.onSave)`.
   The guard catches the exception, reports it through `unexpected()`, updates the scope
   and republishes the URL. Leave unguarded only what mirrors typing (it must not create a
   history entry). Consequence: an action never rejects to its caller - in a test, watch
   `unexpected`.
4. **Do not call `update()` after writing to an `@observe()`.** The accessor already
   compares, stores and notifies. Call it by hand only for what the decorator cannot see:
   changing INSIDE an array or object already assigned. Assigning a new array triggers it
   (the reference changes); assigning the same value triggers nothing.
5. **Updates are batched (~16 ms).** Reading the scope right after writing reads state in
   transit. In a test, `await settle()` from `wdc-cube-test`; never `sleep`.
6. **Request token when two responses can cross** (filter, search, pagination):
   `const token = ++this.pending` before the await, and a response with
   `token !== this.pending` stays silent. Without it, typing fast shows the result of the
   old filter last.
7. **Do not flip to the place you are already on.** Change your own state, redraw and call
   `this.updateHistory()` so the URL follows. Flipping to yourself redoes the composition
   for nothing.
8. **A trip starts from STATE, not from a copy or from the URL.** The target intent is
   born from `app.newFlipIntent(place)`, which asks each live presenter what it shows. In
   projects with `MainKeys.of(app)`: `await XxxKeys.of(this.app).flip()`. Copying field by
   field forgets the field someone adds later; re-parsing `historyManager.location` is the
   same information in a worse form. **Recorded exception:** the application presenter,
   only at initialization, may re-read the address to know whether the root is the real
   destination. `kickStart` calls the root with `last = true` even when the address is
   deep; without that re-read the root would treat the cold start as "I stopped here"
   (it would send to the entry screen), or would do the flip itself and `kickStart` would
   do another, reapplying the opening parameters over what the reader did during the load.
   Hence: if the address's destination is not the root, return `false` and let
   `kickStart` travel.
9. **Parameter and attribute names are unique across the whole application, each with
   one owner.** The reason is in the cycle: an attempt to flip the face calls
   `applyParameters` in sequence, from the root to the tip, all on the SAME intent. Along
   the way, a presenter can refuse, divert to another face (by the rules of its
   `applyParameters`) and the attempt can even go back to the starting point, usually
   through an exception. If two presenters use the same name, one overwrites the other's
   value in the middle of the attempt, and the resulting state is neither one's. The
   parameter belongs to whoever PUBLISHES it; only someone deeper on the same path can
   read it (by extending the owner's keys). Typical symptom: a list opening with another
   screen's sort order, because both published `sort`. Parameters have no exception.
   Attributes have one, deliberate: the composition slots (`parentSlot`, `dialogSlot`).
   Each level of the path fits into the display place its parent gave it and takes on
   visual parenthood, republishing the slot under the same name so the next level fits
   into the place IT determines. That is why each presenter reads the slot in its own call
   (rule 1).
   **How to guarantee it without relying on memory:** do not use a global name table. Each
   `xxx.key.ts` declares the names it reads and writes in a local table (`P` for
   parameters, `A` for attributes), and every name is a two-letter PREFIX of the file's own
   followed by a local code (`const PREFIX = 'co'` → `coa`, `cob`...). The prefix is unique
   in the application; the local code, unique in the file. Adding a name then only requires
   looking at the file itself, and in a generic module each mount point has its own keys,
   hence its own names. A test that scans the keys files guarantees the prefixes are
   unique.
10. **The address is outside input: validate on arrival, in the keys class.** Anyone can
    edit the bar, and an old legitimate link brings `page=999999`. The keys getter always
    returns a usable value (page with floor and ceiling, positive id or `undefined`,
    closed choice with an allowlist). Since the keys also publish, the garbage leaves the
    address on its own.
11. **Redirecting inside your own flip uses the intent IN TRANSIT**:
    `await this.app.flipToIntent(intent.redirect(place)); return false`. During the flip
    the presenter has not been committed yet, and `Keys.of(app)` would ask the previous
    presenters, losing what the link just brought. `of()` is acceptable in the middle of
    the flip only when the destination needs nothing from the intent in transit, or when
    what it needs goes EXPLICITLY - the session guard that sends to login with
    `next = refusedIntent.toString()` is the typical case. Whoever refuses in the middle of
    the flip on behalf of someone else (a shell that validates the screen's role) receives
    the intent as an argument, so it can redirect with it.
12. **A dialog presenter clears the slot on the way out**:
    `release() { this.dialogSlot(undefined); super.release() }`. Without it the dialog
    stays drawn after the place has left the path.
13. **What another view would write the same way goes up into the presentation.**
    Formatting, masks, validation, pagination rules: they become a domain function or,
    better, a getter on the scope. The symptom of something in the wrong place is divergent
    duplication (the same value written two ways on the same screen). Only what depends on
    HOW it is drawn stays in the view: open menu, focus, refs, gestures, form plumbing.
    **Raw number and reading text are different things, and the scope carries both:** the
    raw one (`distanceMeters`, `share`) serves the chart and the CSV, which do arithmetic;
    the text (`distanceLabel`, `shareLabel`) is a getter over the raw one, written with the
    domain formatters. Arithmetic the screen shows (the fraction over the first step, the
    average per person) also belongs to the presenter. A chart axis is the exception: its
    ticks are born from the view's geometry, so it receives the domain's formatting
    FUNCTION, and never a copy of it.
14. **The presentation does not import the view technology.** Not even types. DOM events
    come in through the structural types of `wdc-cube` (`events`). If a presenter does not
    run in a test without a DOM, it is holding view stuff. **Exporting a file has two
    halves:** the CONTENT (the CSV rows, the PDF pages) belongs to the presentation, built
    by a scope action and tested without a browser; SAVING belongs to the platform, and
    reaches the presentation as a service the renderer installs at startup (a function
    that receives a name and a `Blob`). The view does not build the file, and the
    presentation does not create the link and click it.
15. **Data the navigation will need is fetched at its own moment, not in the middle of the
    trip.** A query inside `applyParameters` leaves the face waiting on the network - on a
    cold start, with an empty body. When it is known BEFOREHAND that the data will be
    needed, it is fetched at that moment and kept with whoever lives as long as it stays
    valid. Where to keep it depends on the case: what holds while the person is logged in
    and decides the structure of the navigation (the companies they can reach, when the
    menu and the opening screen depend on them) belongs in the SESSION, loaded by the
    application presenter at login and in the session restored at startup (F5); what holds
    for an area or a screen stays with its presenter.

    And what is only known during navigation **does not hold up the flip**.
    `applyParameters` waits only for what the NEXT LEVEL of the path needs in order to
    decide - and, when it does, through a light query, centred on that need. The screen's
    own data is loaded in PARALLEL, after the slot and without `await`, with a request
    token; the flip ends right away. The reason is a window the wait opens: while
    `applyParameters` has not returned, the trip has not been committed and the
    application is still in the PREVIOUS place; a reader action in the meantime (the
    screen is already visible) ends up publishing that place's address, and the screen
    "goes back on its own". Also excluded is the legitimate exception of completing what
    failed at its own moment - a network failure at login cannot hold for the whole
    session.

16. **Update the scope in place; reconcile lists by identity.** A list that builds NEW row
    scopes on every load makes the view erase and redraw every row, even when nothing
    changed - the screen flickers, and flickers again every time a dialog opens or closes
    on top of it. For each item that arrives, reuse the row with the same `identity` that
    is already in the scope; newcomers get one, those that left are removed. The row
    builder receives the old row and rewrites ALL of its fields, including those of nested
    scopes (the cells): a field filled only "when there is one" has to go back to empty
    first, otherwise the new load inherits the previous value. And a field that one kind
    of row has and another does not (an open action) is cleared explicitly, because two
    rows of different kinds can have the same identity. Template in
    [references/patterns.md](references/patterns.md), section 11.
17. **Passing through the path is not reloading.** A presenter that stays on the path gets
    `applyParameters` with `initialization: false` on every trip that passes through it -
    including when opening and closing a child dialog, which is a place below it. If what
    it shows is still valid (the same company, the same filter), it fetches nothing: it
    only follows what changed in the address (the tab, the page). Keep the signature of
    what is in hand and compare. Whoever CHANGES the data notifies the list's owner (a
    `refresh()` the child calls after saving); cancelling changes nothing and does not
    notify.

More items, organized for review: [references/review-checklist.md](references/review-checklist.md).

## Which kind of presenter you are writing

The first four take part in the cube (they have a place and fulfil the contract). The last
two are children under an owner's responsibility, with no face of their own. The "where it
lives" column follows the reference organization.

| Kind                | Has a place?    | Draws?           | Where it lives                        | When                                                        |
| ------------------- | --------------- | ---------------- | ------------------------------------- | ----------------------------------------------------------- |
| **Screen**          | yes             | yes              | folder at its position in the tree    | the common case                                             |
| **Concept**         | yes             | no (empty scope) | subject folder, parent of the screens | two sibling screens share state (list and detail)           |
| **Guard**           | yes             | may not draw     | in the branch it protects             | session, role; redirects and returns `false`                |
| **Generic**         | yes, in several | yes              | `generic/`                            | the same screen mounted at two exclusive points of the tree |
| **Component**       | **no**          | yes, a segment   | `components/`                         | segment that several screens host (period selector)         |
| **Dedicated child** | **no**          | yes, a segment   | owning module's folder                | segment of ONE screen: a tab, a stacked panel, a section    |

The question that separates generic from component: **is it a destination?** Generic has a
place, keys, URL and Back; component and dedicated child have no place - they take care of
a SEGMENT of the view of whoever is on the face, with their own scope. The owner decides
their lifecycle, delegates to each one its part of `applyParameters` and
`publishParameters`, and calls each one's `release`. Which one is active, and in what
order, is a parameter of the owner.
Details and templates for each one in [references/patterns.md](references/patterns.md).

## Workflows

### Create a new screen

1. Decide on which **face** it appears: inside what is it? Nesting says what the place is
   inside of, not how you got to it. Follow the project's organization; if it does not
   have one, use the reference one
   ([references/organization.md](references/organization.md)).
2. Declare the place in `Places` (with `Place.UNKNOWN`). Create the place's keys with a
   new prefix, unique in the application, and declare the parameters and attributes in
   its local table.
3. Write keys → scope → presenter → view → view registration → entry in `routes.ts`.
4. Write a test without a DOM: `TestHistoryManager` at the address, `kickStart`,
   `settle()`, assertion on the scope and on `history.token`. Start with the cold start
   (pasted link): it is the state most likely to be wrong.
5. Compile the presentation before running the view, if the renderer consumes it compiled
   (see "Diagnose").

### Change an existing screen

- **Filter, page, sort order, tab, open dialog**: it is a place parameter. Getter and
  setter with validation in the OWNER's keys, read in `applyParameters`, written in
  `publishParameters`, and the action changes the state and calls `updateHistory()`
  (rule 7).
- **State that is the reader's preference** (column order, collapsed panel) does not go in
  the URL: a link sent to a colleague opens with THEIR preference. It goes to local storage
  or the server, decided by the presentation.
- **Take the user to another screen**: the destination's keys built from state (rule 8),
  set what the destination needs to receive, `flip()`. Heavy data already in hand (the
  clicked row) travels as an **attribute** of the intent, not as a parameter: an attribute
  does not go to the URL.
- **New action**: declare it in the scope with the right type (`Scope.ASYNC_ACTION`,
  `ASYNC_ACTION_STRING`, `ASYNC_ACTION_ONE<T>()`...), bind it in `initialization`, call it
  in the view.

### Review Cube code

Go through [references/review-checklist.md](references/review-checklist.md) file by file.
Report each finding with the symptom it produces ("the button does nothing", "the list
opens out of order"), not just with the name of the rule - the symptom is what convinces.

### Diagnose a defect

Start with the symptom table in [references/diagnosis.md](references/diagnosis.md). The
three most common:

- **`scope.onX is not a function`** with the right code: the view is seeing an old version
  of the scope class. It is almost always the compiled presentation being out of date (the
  renderer reads `lib/`, not `src/`). Recompile; do not touch the code.
- **Button that does nothing, no error**: action declared and not bound (rule 2).
- **Blank screen**: scope with no registered view, or two copies of `wdc-cube` in
  `node_modules` (two `Scope`s, two registries - the bridge does not recognize the scope).

## To go deeper

- [references/organization.md](references/organization.md) - a reference code
  organization, for when the project does not have its own: packages, folders, names,
  where each kind of presenter and resource lives.
- [references/framework.md](references/framework.md) - the API: cycle, slots, keys, update
  pipeline, `ObservableArray` and hints, address codec, tsconfig, bindings (Solid, React,
  Angular, custom elements) and tests with `wdc-cube-test`.
- [references/patterns.md](references/patterns.md) - module templates and the concept,
  guard, generic and child presenter patterns (tabs, stacked segments, component).
- [references/review-checklist.md](references/review-checklist.md) - review checklist.
- [references/diagnosis.md](references/diagnosis.md) - symptom → cause → fix.
