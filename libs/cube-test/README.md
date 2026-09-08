# wdc-cube-test

Test helpers for driving a [Cube](../../docs/architecture.md) presentation layer
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
