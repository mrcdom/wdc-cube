# cube-tutorial-angular

The Angular view layer of the [Cube architecture](../../docs/architecture.md)
example, built with Angular 22 and SCSS. It doubles as the manual test bed for
`wdc-cube-angular`.

It renders the very same presenters, scopes and services as
[cube-tutorial-react](../cube-tutorial-react/README.md), taken unchanged from
[cube-tutorial-core](../cube-tutorial-core/README.md). Reading the two apps side
by side shows what a view technology actually has to supply, because that is the
only thing that differs between them.

There is no component library here on purpose. The todo-mvc module is plain HTML
and SCSS in the React app too, and keeping the rest that way makes the difference
between the two apps the Cube binding rather than MUI versus Angular Material.

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
