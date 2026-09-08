# cube-tutorial/presentation-test

The tutorial's presentation layer, exercised with no view attached.

This sits beside [cube-tutorial/renderer-react](../renderer-react/README.md) and
[cube-tutorial/renderer-angular](../renderer-angular/README.md) because it plays the
same part they do: it drives
[cube-tutorial/presentation](../presentation/README.md) without changing a line of
it. The difference is that where those two answer the view boundary with React
and with Angular, this one does not answer it at all — which is what makes it a
proof rather than a rehearsal. If the presenters need a document to work, they
were never view-agnostic.

The reusable half lives in [wdc-cube-test](../../../libs/cube-test/README.md); what
is here is specific to this application.

## Running it

From the workspace root:

```bash
pnpm compile     # builds wdc-cube, wdc-cube-test and cube-tutorial/presentation
pnpm test        # runs every package's tests, this one included
```

`vitest.config.ts` asks for the `node` environment rather than jsdom, and that is
load-bearing: needing a document here would mean something had leaked across the
view boundary. It has caught exactly that once — see below.

## The shape of a test

```ts
harness = await startTutorial('/subscriptions/detail?site-id=2')

await harness.scope.dialog?.onClose()
await harness.settle()

expect(harness.scope.body).toBeInstanceOf(SubscriptionsScope)
```

`startTutorial` boots the application at an address, the way a browser landing
there would — including landing straight on a dialog, which is where the
interesting cases turned out to be. `settle()` waits for the update batch and
then **fails if the presentation layer reported an error**, because an action
swallows what it throws: without that check a test reads a scope that quietly
never changed and passes.

## What it found

Both regressions here are bugs that shipped, and both fail against the code as
it was:

- **Cancel left the module after a reload.** Opening the subscribe dialog by
  address and closing it went Home. `lastPlace` is the root place until the
  first flip commits, so on a cold start the presenter read it as somewhere the
  user had been.
- **Clear completed removed the wrong half.** The predicate handed to
  `removeByCriteria` was negated, so it dropped the active items and kept the
  completed ones — since the tutorial was first written.

And one the harness turned up while being written: `ObservableArray#removeByCriteria`
defaulted its `thisArg` to `window`, so it threw outside a browser. It was the
one method on that class that could not run headless, and nothing had ever run
it headless before.

## What it does not cover

The views. Whether a component paints the scope and fires the actions belongs to
the React and Angular projects; appearance and layout belong to a browser. The
todo-mvc module once rendered as completely unstyled markup while its markup,
class names and actions were all correct — no assertion at this level, or at the
view level, would have gone red.
