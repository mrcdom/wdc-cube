# wdc-cube-angular

Angular bindings for the [Cube architecture](../../docs/architecture.md).

The architecture document states the view boundary as two obligations. This
package is those two, and nothing else:

| Obligation | Here |
| --- | --- |
| Answer `scope.forceUpdate()` | `bindScope()` |
| Resolve a scope to a view | `ViewFactory` + `*cubeViewSlot` |

Everything above that line — places, intents, presenters, scopes, actions,
services — comes from `wdc-cube` and is shared with any other view technology.

## Binding a view to its scope

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

`bindScope` points the scope's `forceUpdate` at `ChangeDetectorRef.markForCheck()`
and releases it when the input changes or the component is destroyed.

This is a plain component: no base class, no inheritance slot consumed, nothing a
developer who knows Angular would not recognise. `bindScope` is a function using
`inject()`, in the same shape as `takeUntilDestroyed()`.

**Zoneless is the natural fit.** Since v21 Angular no longer discovers changes on
its own and expects explicit notification — which is exactly what `forceUpdate`
is. A Cube application therefore has no change detection to spare: it redraws the
scopes the presenter marked, and nothing else.

**`OnPush` is not optional.** Without it a component would also be checked for
reasons Cube knows nothing about, which defeats the point of the presenter
deciding what changed.

## Rendering a slot

```html
<ng-container *cubeViewSlot="scope().page"></ng-container>
```

`ViewFactory.register(SomeScope, SomeView)` pairs a scope class with a component;
the slot renders whichever one matches the scope currently in it. That is how a
presenter places a child without naming the component that draws it.

It is a **structural directive** rather than a wrapper component, so the slot
itself adds nothing to the DOM.

The component it renders still gets a host element — Angular always gives one,
and React has no equivalent. Left alone that element sits between the slot's
parent and the view's own markup and quietly breaks any layout the two were
meant to share: a flex child stops being a flex child, and a scroll container
stops being constrained by its parent. The slot therefore sets the host to
`display: contents`, which keeps it out of the box tree and puts the view's
markup where React would have put it. A view that wants a real box of its own
takes it back with `:host { display: block !important }`.

## Registries do not collide

Each binding package builds its own registry through `createViewRegistry` in
`wdc-cube`. The mechanism is shared; the symbol under which the view is stored is
not. The same scope class can therefore carry a React view and an Angular view at
the same time, which is what lets one core drive both.

## Tests

`bindScope` takes any `Signal`, not only a component input, so its logic is
exercised in a plain injection context. Compiling a real component would require
the Angular compiler, which an application's build provides and this package's
does not — signal inputs are an AOT feature. The slot directive is therefore
covered by the example application rather than here.
