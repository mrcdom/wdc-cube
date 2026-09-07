# cube-tutorial-angular

The Angular view layer of the [Cube architecture](../../docs/architecture.md)
example, built with Angular 22, Angular Material and SCSS. It doubles as the
manual test bed for `wdc-cube-angular`.

It renders the very same presenters, scopes and services as
[cube-tutorial-react](../cube-tutorial-react/README.md), taken unchanged from
[cube-tutorial-core](../cube-tutorial-core/README.md). Reading the two apps side
by side shows what a view technology actually has to supply, because that is the
only thing that differs between them.

The shell, the alerts and the subscriptions screens use Angular Material, which
is the counterpart to the React app's MUI — the two apps then differ in their
Cube binding rather than in whether they have a component library at all. The
todo-mvc module stays plain HTML and SCSS in both, so at least one screen shows
the binding with nothing else in the way.

## Running it

From the workspace root:

```bash
pnpm install
pnpm compile              # builds wdc-cube and cube-tutorial-core
pnpm start:angular        # http://localhost:3001
```

The React app runs on port 3000, so both can run at once.

## What Angular brings

**Zoneless is the natural fit.** Since v21 Angular no longer discovers changes on
its own and expects explicit notification — which is exactly what a scope's
`forceUpdate` already is. `bindScope` points it at `ChangeDetectorRef.markForCheck()`,
and nothing is checked that Cube did not ask for.

**A view is a plain component.** No base class and no inheritance slot consumed:

```ts
@Component({
    selector: 'v-item',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `<li>{{ scope().title }}</li>`
})
export class ItemView {
    readonly scope = input.required<ItemScope>()

    constructor() {
        bindScope(this.scope)
    }
}
```

**`*cubeViewSlot` is a structural directive**, so the rendered view is the slot's
only output — no host element wraps it, matching what the React binding does.

**Signals meet the scope at the edges.** A scope is not a signal; `bindScope`
takes the scope *input* signal so it can follow a component reused for a
different scope, and `viewChild` is a signal, which is what lets the item view
focus its edit field exactly when the field enters the DOM.

## Where it differs from the React app

**The `[value]` binding does not lose keystrokes.** React restores a controlled
input's value at the end of every event, so a field backed by an asynchronously
updated scope loses characters typed faster than the flush. Angular writes on
change instead, and typing at 0, 16 and 60 ms per key all arrive intact.

It can still fail to *clear*, though, which is why the new-todo field is
uncontrolled here as well: type and press Enter inside one flush window and the
scope returns to `''` — the value Angular already believed — so it never writes,
and the typed text stays on screen. `afterEveryRender` pushes the scope value in
when the two disagree, which is the same shape as the React view's
`onAfterRender`.

**Legacy decorators do not reach the compiler.** Angular refuses
`experimentalDecorators`, and `wdc-cube`'s `@observe` is a legacy decorator using
`Reflect.getMetadata('design:type')`, which standard decorators have no
equivalent for. `cube-tutorial-core` is therefore compiled to `lib/` rather than
consumed as source, so its decorators are already erased into plain calls by the
time Angular sees them.

**A few build settings exist for reasons worth knowing.** `wdc-cube-angular` is
excluded from the dev server's prebundling and its sources are part of this app's
TypeScript program, because it is source-only — publishing it will need
ng-packagr, since an Angular library cannot be built with plain `tsc`. And this
app declares `history` and `reflect-metadata`, transitive dependencies of
`wdc-cube`, because Angular's dev server resolves from a rewritten path that
cannot reach them under pnpm's strict layout.

## Theming

`styles/index.scss` applies `mat.theme()` once, on `html`, and everything else
reads the `--mat-sys-*` custom properties it emits rather than naming colours:

```scss
html {
    color-scheme: light;
    @include mat.theme((color: mat.$azure-palette, typography: Roboto, density: 0));
}
```

`color-scheme: light` pins the app to the light scheme, like the React app.
Following the system setting is nearly free at the Material layer — the theme
emits `light-dark()` values on its own — but not for the app as a whole: the
todo-mvc module is the original TodoMVC stylesheet, a fixed light design that
paints its card `#fff` and never gives an active item a text colour. Under a dark
scheme the browser default turns those labels white on that white card and the
active todos disappear. Supporting dark means reworking that stylesheet, not
flipping a token.

The app bar asks for `primary` explicitly, through `mat.toolbar-overrides()` and
the matching button mixins rather than by naming the generated custom properties.
Material 3 dropped the `color` input `mat-toolbar` had under Material 2, and its
default toolbar is surface-coloured — on this palette close enough to the page
behind it that the bar stops reading as a bar.

Two more places need more than the generated tokens:

- **Alert severities.** Material 3 defines `primary`, `secondary`, `tertiary` and
  `error`, and no success or warning. Deriving those two from the palette made
  both come out the same pale blue, so `styles/index.scss` adds
  `--app-sys-success-*` and `--app-sys-warning-*`.
- **The todo-mvc stylesheet.** It is declared on that module's root component
  with `ViewEncapsulation.None`, and every rule is nested under
  `.todo-mvc-view`. Cube gives each scope its own component, and this stylesheet
  is written across that split — `.todo-list li` has the list in one component
  and the item in another, which emulated encapsulation will not let match. See
  [wdc-cube-angular](../../libs/cube-angular/README.md#styles-that-cross-the-component-split).
- **The body slot.** `.body` is a single-cell grid, so a view seated in it
  stretches to fill it on both axes — the way it does in React, where the slot
  hands its class to the view and the two are one element. See
  [wdc-cube-angular](../../libs/cube-angular/README.md#sizing-what-a-slot-renders).
- **The flex chain.** `.main-view` and `.body` carry `min-height: 0`. A column
  flex item defaults to `min-height: auto` and refuses to shrink below its
  content, which pushes the shell past the viewport instead of letting the
  scroll container inside it scroll — visible in the todo stress mode, where the
  page is 20000px tall. React never needs this because its scroll container is
  itself the flex item, and an overflow other than `visible` already resolves
  that minimum to zero.

## Tests

`pnpm test` renders each view against a scope built by hand: does it paint what
the scope says, and does it fire the actions it was handed. No presenter and no
application — what those do is settled in
[cube-tutorial-test](../cube-tutorial-test/README.md).

It runs through `@angular/build:unit-test` rather than vitest directly, and that
is not a preference. Vitest's own transform leaves the decorators in place —
`@(0, import_0.Component)(...)`, which is not valid syntax, since decorators are
not in V8 — and downlevelling them would mean asking the transform for
`experimentalDecorators`, which Angular 22 refuses in the real build. The CLI
builder compiles components the way the application is compiled, so the tests run
against what ships. Providers come from `src/test/providers.ts`, zoneless like
the app.

`zone.js` is a devDependency and is never executed: the test harness imports
`zone.js/testing` behind a `typeof Zone !== 'undefined'` guard, and the import
still has to resolve.

What these do not cover is appearance — the failure that started this app's
styling work had correct markup, correct class names and correct actions.

## Folder layout

```
src/index.html
src/main.ts                 bootstraps services, views, routes, the root component
src/scripts/
    modules/
        ViewCatalog.ts      registers every scope→view pair
        <module>/
            index.ts          registerViews for this module
            v-*.ts            one file per view, template inline
            *.scss            styles, scoped by Angular
    styles/                 global stylesheet
```
