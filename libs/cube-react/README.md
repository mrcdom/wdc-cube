# wdc-cube-react

React bindings for the [Cube architecture](../../docs/architecture.md).

The architecture document states the view boundary as two obligations. This
package is those two, and nothing else:

| Obligation | Here |
| --- | --- |
| Answer `scope.forceUpdate()` | `classToFComponent()`, or `bindUpdate()` |
| Resolve a scope to a view | `ViewFactory` + `ViewSlot` |

Everything above that line — places, intents, presenters, scopes, actions,
services — comes from [`wdc-cube`](../cube/README.md) and is shared with any
other view technology.

## A view is a class, rendered as a function

```tsx
class ItemViewClass extends FCClass<{ scope: ItemScope } & IViewProps> {
    private readonly onToggle = () => this.scope.actions.onToggle()

    render() {
        return (
            <li className={this.scope.completed ? Css.completed : ''}>
                <input type="checkbox" checked={this.scope.completed} onChange={this.onToggle} />
                <label>{this.scope.title}</label>
            </li>
        )
    }
}

export const ItemView = classToFComponent(ItemViewClass)
```

`classToFComponent` memoises one instance for the component's lifetime and
points the scope's `forceUpdate` at a state setter. The shape earns its keep:

- **Handlers are stable by construction.** `this.onToggle` is the same function
  on every render because the instance is the same object, so `useCallback`
  never appears and `React.memo` downstream is not defeated by a new closure.
- **`scope` arrives declared and typed.** `FCClass<P>` reads it out of the props
  through `ScopeOf<P>`, so no view repeats the field. A view that would rather
  not extend anything can implement `FCClassContext<P>` and declare it by hand.
- **State that belongs to the view stays on the instance**, as fields, rather
  than in a hook that has to be ordered correctly.

Four optional hooks are called if the class defines them: `onSyncState(props, initial)`,
`onAttach`, `onDetach`, and `onAfterRender`. The last one is only wired when the
prototype declares it, so a view that does not use it pays for no effect —
declare it as a method, not an instance field, or the binding cannot see it and
says so.

`bindUpdate(React, scope)` is the older hook form, for a component written as a
plain function. It still works and the tutorial no longer uses it.

## Rendering a slot

```tsx
<ViewSlot className={Css.body} scope={scope.body} optional={false} />
```

`ViewFactory.register(SomeScope, SomeView)` pairs a scope class with a component;
the slot renders whichever one matches the scope currently in it. That is how a
presenter places a child without naming the component that draws it.

The slot renders the view **directly** — there is no wrapper element. `className`
and `style` are passed to the view, which merges them onto its own root, so the
element the slot stands for and the view's own root are one element. A view
placed in a container that fills its parent therefore fills it too, with nobody
deciding to. Angular cannot do this, since a slot there cannot reach into a
component's template; the difference is written up in
[wdc-cube-angular](../cube-angular/README.md#sizing-what-a-slot-renders).

## Registries do not collide

Each binding package builds its own registry through `createViewRegistry` in
`wdc-cube`. The mechanism is shared; the symbol under which the view is stored is
not. The same scope class can therefore carry a React view and an Angular view at
the same time, which is what lets one core drive both.

## Controlled inputs need care

React restores a controlled input's value at the end of every event, while a
scope updates asynchronously — so a field bound to `scope.value` loses keystrokes
typed before the presenter catches up. This is not a Cube defect and reproduces
on any React version; it is simply what the two policies do together.

The answer is an uncontrolled field: `defaultValue` plus an `onAfterRender` hook
that writes the scope's value into the DOM only when the two disagree, which
leaves typing alone and still lets the presenter clear the field. The tutorial's
`v-header` does exactly that, and its tests spell out the coupling that makes it
work.

## Also exported

`CubeRefObject` is a ref object a class field can hold. `ReactComponent` and
`CubeComponent` are the class-component bases that predate `classToFComponent`;
they still work and nothing new should reach for them.

## Building it

```bash
pnpm compile        # from the workspace root
pnpm test
```
