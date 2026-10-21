# Diagnosis: symptom → cause → fix

In Cube, the cause is rarely where the symptom shows up. Use the table to know where to
look first. Confirm the hypothesis before changing code: several of these symptoms come
from the environment, not from the code.

| Symptom | Likely cause | Where to look / fix |
|---|---|---|
| `props.scope.onX is not a function`, but the code has `onX` on the scope and the presenter binds it | The view sees an OLD version of the scope class: the compiled presentation (`lib/`) is out of date relative to the renderer's `src/` | Compare `lib/` with `src/`. Recompile the presentation and restart the dev server. Do not touch the code. To prevent it: `dev` compiles and watches the presentation |
| Button does nothing, no error in the console | Action declared on the scope and never bound; the placeholder is a no-op that only logs in debug | Look for the binding in `if (initialization)` |
| Button works on the first visit and not after coming back | Action bound in the wrong place, or bound to a scope instance that was replaced | Bind in `initialization`, on the scope that is published |
| Blank screen, no error | Scope with no view registered in the catalog | Check the module's `register` and whether the catalog calls it |
| Blank screen, with `Cannot read properties of undefined` coming from the binding | Two copies of `wdc-cube` (different peers between presentation and renderer) | `readlink */node_modules/wdc-cube` in both packages; make the peers equal |
| Blank screen with a module 404 in the console after moving a file | The dev server keeps the old module graph | Restart the dev server |
| When navigating, the previous screen stays frozen until the new one loads | Slot filled after the network await | `parentSlot(this.scope)` before the await |
| Filtering fast shows the result of a previous filter | Responses crossed and the old one arrived last | Request token |
| A list opens out of order, or with a filter nobody set, after coming from another screen | Two owners for the same parameter name (e.g.: `sort` on two screens) | Look for the repeated name: each keys with its own prefix |
| Screen opens with data from ANOTHER record or another screen, no error, only after certain trips | Attribute (or parameter) with the same name in two presenters on the same walk: one overwrote the other during the attempt to flip the face | Look for the repeated name; each keys with its own prefix and names in the local table |
| F5 or Back loses filter/page/tab | State kept in the view or in the presenter and not published | Parameter in the keys + `publishParameters` |
| Action changes the screen, but the URL does not follow | `updateHistory()` was missing; or the parameter's owner is another presenter and did not receive the new state first | Give the state back to the owner (`concept.moveTo`) and then `updateHistory()` |
| Redirect loses the parameters that just arrived (sometimes only when browser storage is blocked, because a local memory masked the loss) | `Keys.of(app)` used during the flip (the presenter has not been committed yet), including by whoever refuses on behalf of another screen | `intent.redirect(place)` + `return false`; pass the intent to whoever refuses |
| Pasted link opens the right screen but the parameters "come back by themselves" during the load | The root flipped itself on cold start, and `kickStart` did another | On initialization, the root only rereads the address and returns `false` |
| Dialog stays open after navigating away from it | Dialog presenter does not clear the slot in `release()` | `this.dialogSlot(undefined)` in `release()` |
| `Maximum call stack size exceeded` or a burst of requests on the first click (Solid) | A write to an `@observe()` inside the update cycle it itself caused: reassigning a component's scope on every redraw, or `show()` rewriting the same value | Hand over the component's scope once; `show()` with an equal value becomes a no-op |
| A click during a long load takes the screen back to the previous place (or to `#/`) | `applyParameters` waits for the load: the trip has not been committed yet, and the reader's action publishes the address of the previous place | Load in parallel, without `await`, with a token; wait only for what the next level needs |
| Closing a dialog opened by a pasted link leaves the whole module | Closing uses `lastPlace`, which on cold start points to the root | Use `app.hasNavigated`; with no navigation, go back to the logical parent |
| Pasted link opens the screen in the default state | Codec installed after `kickStart`; key changed; or the keys guard refused the value | Install the codec first; check the guard |
| Test passes but the screen is wrong | Action swallowed an exception (`unexpected`) and the test did not observe it; or assertion before `settle()` | Wrap `unexpected`; `await settle()` |
| React component loses keystrokes in the input | Controlled input + asynchronous scope update | Uncontrolled input with `onAfterRender` |
| List flickers when opening or closing a dialog over it, or on every reload | (1) The owner's `applyParameters` reloads on every pass through the path; (2) the rows are NEW scopes on every load, and the view redoes them; (3) the "loading" veil appears even on a fast response; (4) cancelling the dialog calls `refresh()` | Compare the signature of what is at hand before fetching; `reuseRows` by `identity`; veil with a threshold; only saving notifies. See patterns.md, section 11 |
| After reloading, a cell shows a value that no longer exists | Row reused without going back to empty: the builder only fills "when there is" | In the builder, clear the field before the `if`; applies to nested scopes |
| Change in a child scope does not redraw | Child created without `child.update = this.update`, or field without `@observe()` | Bind the update; decorate the field |
| Change inside an array/object does not redraw | The accessor only sees assignment | Assign a new array, or `update()` by hand |

## Procedure when nothing in the table matches

1. Reproduce it in a test with no DOM (`TestHistoryManager` at the problem's address,
   `kickStart`, `settle`). If the test reproduces it, the defect is in the presentation;
   if not, it is in the view or in the environment (build, dev server, binding).
2. Read `history.tokens`: the sequence of published addresses tells the real navigation.
3. Follow the cycle: who received `applyParameters` with which `initialization` and
   `last`, who returned `false`, who was released.
4. Only then read the framework (`libs/cube/src/impl/Application.ts`, `FlipContext.ts`,
   `Presenter.ts`).
