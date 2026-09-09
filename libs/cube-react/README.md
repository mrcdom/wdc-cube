# wdc-cube-react

React bindings for the [Cube architecture](https://github.com/mrcdom/wdc-cube/blob/master/docs/architecture.md).

The architecture document states the view boundary as two obligations. This
package is those two, and nothing else:

| Obligation | Here |
| --- | --- |
| Answer `scope.forceUpdate()` | `classToFComponent()`, or `bindUpdate()` |
| Resolve a scope to a view | `ViewFactory` + `ViewSlot` |

Everything above that line — places, intents, presenters, scopes, actions,
services — comes from [`wdc-cube`](https://github.com/mrcdom/wdc-cube/tree/master/libs/cube#readme) and is shared with any
other view technology.

## What your tsconfig needs

Two settings, and they carry different weight.

```jsonc
{
  "compilerOptions": {
    // Required. `@observe()` and `@Observable` are legacy decorators; without
    // this they are read as the current proposal and fail to compile.
    "experimentalDecorators": true,

    // Recommended. `@observe()` installs an accessor on the prototype, and a
    // native class field defines an own property on every instance that shadows
    // it. The framework handles that — it reads the value back, deletes the
    // property and writes it through the accessor — but `delete` is what drops
    // an object into V8's dictionary mode. Measured in this repository: 298ns
    // per scope built against 98ns, and fast properties kept.
    "useDefineForClassFields": false
  }
}
```

Only the first is a requirement: with native class fields everything still
works, and every scope your application builds costs more than it needs to.

A renderer usually needs neither. In a Cube application the scopes live in the
presentation layer, compiled by `tsc`, and the views that draw them hold no
decorator at all — which is why the SolidJS example configures no Babel
decorator plugin, and why it would break if it had to.
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
[wdc-cube-angular](https://github.com/mrcdom/wdc-cube/tree/master/libs/cube-angular#readme).

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

## The code, and something to look at

This binds a Cube presentation layer to React, and the presenters it draws know nothing about React. The argument it belongs to is easier to see than to read about.

**[Open the showcase](https://mrcdom.github.io/wdc-cube/)** — an issue tracker where every filter, page,
sorted column and open dialog is a place. Change one and watch the address bar:
Back undoes it, a reload lands on it, and the link you copy opens the same thing
for someone else. Nothing in it writes that URL — each presenter says what it is
showing, and the address is assembled from all of them.

**[Read the source](https://github.com/mrcdom/wdc-cube)** — one presentation layer, drawn by four view
technologies: React, Angular, SolidJS and custom elements. Adding the second, the
third and the fourth needed no change to the presenters, which is the claim the
repository exists to demonstrate, kept honest by having to hold four times over.

| | |
| --- | --- |
| This package's source | [`libs/cube-react`](https://github.com/mrcdom/wdc-cube/tree/master/libs/cube-react) |
| How the pieces fit | [The Cube architecture](https://github.com/mrcdom/wdc-cube/blob/master/docs/architecture.md) |
| The showcase | [live](https://mrcdom.github.io/wdc-cube/) · [source](https://github.com/mrcdom/wdc-cube/tree/master/apps/cube-showcase#readme) |
| The tutorial, drawn four ways | [source](https://github.com/mrcdom/wdc-cube/tree/master/apps/cube-tutorial) |
| Issues and discussion | [github.com/mrcdom/wdc-cube/issues](https://github.com/mrcdom/wdc-cube/issues) |

MIT © WeDoCode Consultoria e Soluções Avançadas LTDA.
