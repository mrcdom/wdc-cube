# wdc-cube-test

Test helpers for driving a [Cube](https://github.com/mrcdom/wdc-cube/blob/master/docs/architecture.md) presentation layer
with no view attached.

The architecture states the view boundary as two obligations — answer
`scope.forceUpdate()`, and resolve a scope to a view. `wdc-cube-react`,
`wdc-cube-angular`, `wdc-cube-webc` and `wdc-cube-solid` each implement both.
This package implements **neither**, on
purpose.

That is the whole idea. A presenter is written not to know what draws it, so the
way to prove it right is to run it with nothing drawing it at all: drive
intents, read the scope tree it publishes, read the tokens it pushes to history.
A stand-in view would only add something else that could be wrong.

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
## What a test looks like

```ts
const history = new TestHistoryManager('/subscriptions/detail?site-id=2')
const app = new MainPresenter(history)

await app.kickStart(Places.main)
await settle()

expect(app.scope.dialog).toBeInstanceOf(SubscriptionsDetailScope)

await app.scope.dialog?.onClose()
await settle()

expect(app.scope.body).toBeInstanceOf(SubscriptionsScope)
expect(history.token).toEqual('/subscriptions')
```

No document, no renderer, no mocking framework — a scope's action is a plain
function property, so a test calls it directly or replaces it with a spy.

## What is here

**`TestHistoryManager`** — history in memory. `location` is writable, which is
what lets a test start the application anywhere: an application reads it while
kick-starting and flips there, so setting it before boot reproduces a reload or
a shared link. That is the state where nothing has been visited yet, and the one
most likely to be wrong. Every token published is kept, so a test can assert
what the address bar would have shown at each step.

**`settle()`** — waits until the presentation layer stops moving. A presenter
does not redraw on the spot: it marks scopes and lets `CallbackManager` batch
them onto the next frame, sixteen milliseconds away. A test that asserts
straight after an action therefore reads the tree mid-flight. Sleeping past the
timer would work and would be a guess; this drains the queue deliberately, and
repeats, because a scope updated during `onBeforeScopeUpdate` schedules another
round. It throws rather than hangs if updates never settle.

**`presenterOf(app, place)`** — the presenter mounted at a place, typed, failing
loudly when there is none. `Application#getPresenter` returns
`ICubePresenter | undefined`, and a cast over `undefined` turns a navigation that
silently did not happen into a `TypeError` several lines later, pointing at the
wrong thing.

**`ScopeUpdateRecorder`** — counts the redraws a presenter asks for. Which
scopes it marks, and which it leaves alone, is part of the presentation layer's
behaviour rather than any view's: it is the only way to state "editing one item
redrew that item and not the other nine hundred" without rendering anything.

## What this does not cover

The view. Whether a component paints the scope it was handed, and fires the
actions it was given, is tested against that technology — see the binding
packages, which cover the update contract itself, and each app's own tests for
its markup.

Appearance is a third thing again, and resists both: a stylesheet whose
selectors never match, a flex chain that will not shrink, a dialog that lands at
the wrong depth. The markup is correct in every one of those, so a test that
asserts on markup passes. Those need a browser.

## Errors are quiet by default

An action swallows what it throws: it reports through `IPresenter#unexpected`
and returns. A test that does not watch for that reads a scope which quietly
never changed, and passes. Every presenter routes `unexpected` up to the
application, so wrapping it once at the top is enough to make those loud — see
`startTutorial` in `apps/cube-tutorial/presentation-test` for the shape.

## The code, and something to look at

This drives a Cube presentation layer with nothing attached to draw it. The argument it belongs to is easier to see than to read about.

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
| This package's source | [`libs/cube-test`](https://github.com/mrcdom/wdc-cube/tree/master/libs/cube-test) |
| How the pieces fit | [The Cube architecture](https://github.com/mrcdom/wdc-cube/blob/master/docs/architecture.md) |
| The showcase | [live](https://mrcdom.github.io/wdc-cube/) · [source](https://github.com/mrcdom/wdc-cube/tree/master/apps/cube-showcase#readme) |
| The tutorial, drawn four ways | [source](https://github.com/mrcdom/wdc-cube/tree/master/apps/cube-tutorial) |
| Issues and discussion | [github.com/mrcdom/wdc-cube/issues](https://github.com/mrcdom/wdc-cube/issues) |

MIT © WeDoCode Consultoria e Soluções Avançadas LTDA.
