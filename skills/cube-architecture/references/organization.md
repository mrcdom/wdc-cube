# A reference code organization

The Cube architecture does not say how to organize the code: it defines the cube, the
faces, the intent and the presenters' contract. What follows is an organization that
worked in a production application (a public area and a restricted area, a couple of
dozen modules, several user profiles), and that serves as a starting point when the
project does not have its own. If the project already has one, that one wins over this.

The idea that ties it all together: **the folder tree is the place tree**, read the same
way. Whoever opens a module's folder sees where it is in the cube, what requires a session
and what only exists inside another screen.

## Contents

1. Two packages
2. The presentation
3. The modules
4. The files of a module
5. Where each resource lives
6. Names
7. The renderer
8. Tests

---

## 1. Two packages

```
app/
  presentation/      places, keys, presenters, scopes, domain, server access
  renderer-<view>/   the views, in one technology (solid, react, angular...)
```

- The presentation is pure TypeScript, with no view import, and runs whole in a test with
  no DOM. That is what proves the separation: if a presenter does not run there, it holds
  view concerns.
- The renderer consumes the presentation as a workspace package, through subpaths
  (`app-presentation/orders`, `app-presentation/main`), declared in the `exports` of its
  `package.json`.
- If the renderer reads the COMPILED presentation (`lib/`), the development script
  compiles before starting and keeps the compiler watching. Without that, a new view ends
  up talking to an old presenter, and the symptom (`scope.onX is not a function`) points
  to the wrong place.

## 2. The presentation

```
presentation/src/
  domain/        the vocabulary that SEVERAL screens read: types, formatting, URL guards,
                 shared code tables. index.ts is just the barrel
  infra/         the boundary with the outside world, and nothing of the business: the HTTP
                 client (transport, session, 401/403 policy), the history manager, the
                 address codec, access to browser storage, and "save file" (a service
                 whose function the renderer installs at startup)
  components/    presenters WITHOUT a place, hosted by several screens (period picker,
                 company picker, analysis panel). A sibling of modules/, not a child: a
                 component is not a module
  modules/
    main/        the application presenter (Places.main = Place.ROOT)
    concrete/    one module per screen, AT THE POSITION WHERE IT APPEARS IN THE CUBE
    generic/     modules mounted at more than one point of the cube
    route-consts.ts   Places - the wiring is not a module (the NAMES live in each *.key.ts)
    routes.ts         the cube: the registered tree
  test/          tests with no DOM
```

`infra/` is called that, and not `services/`, because nothing there knows what an order or
a customer is. "Service" in the business sense is each subject's `.api.ts` (section 5).

## 3. The modules

```
modules/concrete/
  account/            public CONCEPT: sign in, create account, recover password
    sign-in/
    forgot-password/
  shared-link/        public screen, reached by link (outside the guard = public)
  restricted/         session GUARD, which also draws the shell (menu, header)
    dashboard/
    orders/           CONCEPT: list and detail are siblings
      list/
      detail/         a mount of a generic, if that is the case
    customers/        screen WITH a VIEW (landing point), with dialogs as children
      edit/
      confirm/
modules/generic/
  record-detail/      mounted at orders/detail and at another exclusive point
```

Three readings this tree gives for free:

- **What requires a session** is everything under `restricted/`. What is outside is
  public, with no exception written anywhere.
- **What only exists inside a screen** is inside its folder. An edit-customer dialog is
  not reachable without the customer list, and its file is in `customers/`.
- **When a subject has more than one screen**, the question is whether it has a landing
  point. If the screens replace each other (list or detail, never both), the subject
  becomes a CONCEPT with no view, owner of the common state, and the screens are siblings
  inside it. If a screen never leaves the stage (the list that stays beneath the dialogs),
  it has a view and what comes on top is its child.

`generic/` and `components/` stay outside `concrete/` because they do not have ONE
position: the generic is at several points of the cube at the same time, and the component
is at no point at all.

## 4. The files of a module

```
orders/
  orders.key.ts        the typed reading of the intent: the names (local table with prefix) and the
                       parameters, with a guard on reading
  orders.scope.ts      the rendering state (always in a file of its own)
  orders.presenter.ts  the control state and the cube contract
  orders.api.ts        the server resource this subject uses
  orders.types.ts      the types only this subject knows
  orders-table.ts      columns, sort allowlist and row building
  orders.periods.ts    its own vocabulary (period shortcuts, code tables)
  index.ts             the public surface, which becomes a package subpath
  list/
  detail/
```

- The scope lives in its own file even when it is small. It is the contract with the
  view, and the presenter is the one that moves it; declaring the two together hides that
  division.
- Building rows and columns stays outside the presenter (`*-table.ts`): it is formatting,
  not lifecycle. The sort allowlist lives NEXT TO the columns, and the keys only presents
  it to the guard - a new column and a sortable column are born in the same place.
- A child dedicated to the module (the presenter of a segment of the screen - a tab, a
  panel - that only this module uses) lives in the module's folder, with its own
  `*.presenter.ts` and `*.scope.ts`.

## 5. Where each resource lives

- **Next to the owner of the vocabulary.** What only one screen reads stays in its folder.
  What several screens read stays in the CONCEPT that owns the subject, and the others
  import from there (`customers.api.ts` in the customers folder; the orders screen imports
  from it). That is a readable dependency ("orders uses customer") instead of a technical
  folder.
- **Only goes to `domain/`** what belongs to several screens without a clear owner:
  session, formatting of quantities, pagination, URL guards.
- **A code table** (the value of an enum on the wire) lives with whoever decides the
  values: in the keys that publishes the parameter, in a component if that is who decides,
  in `domain/` if several parameters carry the same vocabulary.
- **The "who am I" resource** belongs to the shell (the guard's presenter), which reads it
  before any screen exists.
- **Do not merge endpoints because the response has the same shape.** Two subjects with a
  similar response are still two `.api.ts`.

## 6. Names

- Files in kebab-case, always, including the one that exports a class
  (`api-client.ts`, `order-list.presenter.ts`).
- Classes: `XxxPresenter`, `XxxScope`, `XxxKeys`, `XxxApi`. The view is `v-xxx.tsx` and the
  function or class `XxxView`, with a named export.
- A component's presenter is not called "panel": the panel is the visualization, and the
  class is what controls it.
- Parameter and attribute names: the two-letter prefix of the keys file + a local code,
  declared in a local table (`P`, `A`) at the top of `xxx.key.ts`. The comment on each
  entry says what the name means. A test scans the `*.key.ts` files and fails if two files
  use the same prefix, if a local code repeats within a file, or if a keys writes a loose
  name outside the table.

## 7. The renderer

```
renderer-<view>/src/
  main.tsx             startup: instrumentation, services, views, routes, codec, render
  instrumentation.ts   what needs to run before any scope exists
  modules/             mirrors the presentation's modules, one per folder
    orders/
      v-orders.tsx
      orders.module.scss
      index.ts         registerViews(rv): binds each Scope to its View
    view-catalog.ts    calls the registerViews of every module
  components/          reusable visual pieces (table, pagination, filters, dialog)
  styles/              theme and tokens
```

- A scope with no registered view falls into a visible fallback ("could not open"), which
  says on screen what is missing and shouts in the console. Better than a blank area.
- The view only draws. The test for whether something moves up to the presentation:
  would another view technology write this the same way? If so, it moves up.

## 8. Tests

- In `presentation/src/test`, with the no-DOM environment (in Vitest,
  `environment: 'node'`).
- The server is replaced at the `.api.ts` method (`vi.spyOn(OrdersApi.INSTANCE, ...)`).
- Each test starts at an address (`new TestHistoryManager('/orders?...')`), does
  `kickStart`, `settle()`, and asserts the scope and `history.token`.
- Browser storage is not DOM: a test double on `globalThis` makes testable what the
  application remembers between visits.
- A suite that pins the address format (unique codes, code tables) fails loudly when
  someone repeats a parameter name.
