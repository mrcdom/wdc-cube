# Review checklist

Go through it by file type. For each finding, write the SYMPTOM it produces - that is what
makes the author understand why it matters. Mark as a defect only what has a symptom; the
rest is a suggestion.

## Keys (`*.key.ts`)

- [ ] Every parameter has a guard on READING: page with floor and ceiling, positive
      integer id or `undefined`, closed choice against an allowlist, text trimmed and with
      a maximum length, sort against the list of columns the table actually sorts.
      *Symptom: an old or edited link opens a broken screen, an expensive query or an
      error.*
- [ ] The setter writes `undefined` for the default value. *Symptom: polluted URL.*
- [ ] The parameter is in the OWNER's keys (whoever publishes it), and the keys of those
      who only read it inherit it.
- [ ] New name declared in the local table of the owner's keys (`P`/`A`), with the file's
      prefix; no loose string in `getParameter`/`setParameter`/`attributes`. A new keys
      gets a prefix that does not yet exist in the application.
      *Symptom: one screen adopts another's filter/sort on a trip.*
- [ ] Heavy data already at hand travels as an attribute (table `A`), not as a parameter.
- [ ] An attribute is also a unique name: same local table, same prefix. Only the
      composition slots repeat, on purpose.
      *Symptom: during a trip that passes through two presenters with the same name, one
      receives the other's data - the screen opens with the wrong record, without any
      error.*

## Scope (`*.scope.ts`)

- [ ] `@Observable` on the class and `@observe()` on every field the view reads.
      *Symptom: the screen does not follow the change.*
- [ ] Every declared action is bound by the presenter. *Symptom: a button that does
      nothing.*
- [ ] The action's type matches the view's call (`ASYNC_ACTION_STRING` for a string etc.).
- [ ] The scope holds no view type or view object.
- [ ] Values arrive ready for display (formatted); a display rule becomes a getter.
      The scope separates the RAW number (for charts and CSV) from the reading TEXT (a
      getter over the raw value, with the domain's formatters). *Symptom: the same value
      written two ways on the same screen, or a local copy of a formatter that diverges
      ("1h 60min").*
- [ ] The scope lives in its own `*.scope.ts`, even a component's.

## Presenter (`*.presenter.ts`)

- [ ] Actions bound inside `if (initialization)`.
- [ ] Intent attributes (slots, references to the owner/shell/concept, data at hand) read
      from the keys on EVERY call, outside `if (initialization)` - before it, if the
      initialization code uses them. *Symptom: after a trip that changes the composition
      above, the screen publishes into the old slot - it disappears, or shows up in the
      wrong place.*
- [ ] Action guarded with `this.action(...)` at the binding site; only the typing mirror
      goes unguarded.
- [ ] `parentSlot(this.scope)` / `dialogSlot(this.scope)` BEFORE the first network await.
      *Symptom: the previous screen freezes during the load.*
- [ ] `applyParameters` does not wait for its own screen's load: it runs in parallel, with
      a token, and the flip finishes right away. Only what the next level of the path
      needs in order to decide is awaited, through a light query. *Symptom: a click during
      a long load takes the screen back to the previous place.*
- [ ] A request that can cross with another uses a token (`++this.pending`) and discards
      the one that lost. *Symptom: a fast filter shows an old result.*
- [ ] No `update()` right after writing to an `@observe()`.
- [ ] Change in your own place: state + `updateHistory()`, with no flip to yourself.
- [ ] `publishParameters` writes everything the screen shows that should survive a
      reload. *Symptom: F5 loses the filter.* And it only writes parameters it OWNS.
- [ ] A trip starts from `Keys.of(app)` / `newFlipIntent`, not from a field-by-field copy
      or a reparse of the URL.
- [ ] A redirect DURING the flip uses `intent.redirect(place)` followed by
      `return false`. `of()` in the middle of the flip only if what the destination needs
      goes explicitly (the login's `next`). Whoever refuses on behalf of another screen
      (`allowEntry`) receives the intent as an argument.
      *Symptom: a refused link or an old address loses the company/filter it carried.*
- [ ] Dialog presenter clears the slot in `release()`.
- [ ] Child scope created by the presenter gets `child.update = this.update`.
- [ ] A reloaded list reuses the row with the same `identity` (`reuseRows`), and the
      builder rewrites ALL the fields, including those of nested cells, bringing back to
      empty what is only filled "when there is". *Symptom: the list flickers on every
      load; or, with badly done reuse, a value that disappeared stays in the cell.*
- [ ] An `applyParameters` with `initialization: false` does not reload what still holds:
      it compares the signature of what is at hand and only follows what changed in the
      address. Whoever changes the data calls the owner's `refresh()`; cancelling does not.
      *Symptom: the list behind a dialog flickers when opening or closing it.*
- [ ] Child presenters (tabs, panels, segments): the owner releases them in its own
      `release()` and when discarding them, and delegates to each one its part of
      `applyParameters` and of `publishParameters`. *Symptom: a closed tab's timer or
      request keeps running; F5 reopens the right tab with the wrong state.*
- [ ] Which child is active, and in what order, is a parameter of the owner, not a new
      place. *Symptom: switching tabs flips the face - the cube recomposes the path, and
      the segment becomes a destination that makes no sense on its own.*
- [ ] A hosted component receives the scope ONCE; `show()` with the same value is a
      no-op. *Symptom in Solid: `Maximum call stack size exceeded` on the first click.*
- [ ] No import of React/Solid/Angular nor of their types.
- [ ] File export: the content is built by a presentation action and handed to a save
      service installed by the renderer. *Symptom: CSV or PDF content with no test, or
      `document`/`URL.createObjectURL` inside the presentation.*
- [ ] A guard that decides based on data it was already known would be needed does not
      query it in the middle of the trip: it was obtained at a proper moment and kept with
      whoever lives as long as its validity (the session, when it holds while the person
      is logged in and decides navigation; the presenter of the area or of the screen, in
      the other cases). *Symptom: on cold start the body stays empty waiting for the
      network; each entry into the restricted area redoes the same query.*
- [ ] Role/session guard at the right level: guarding the whole concept also closes the
      detail opened by a link.

## View

- [ ] Only draws: no formatting, masking, validation or business rule that another view
      would write the same way. *Symptom: the same value appears two ways on the same
      screen.*
- [ ] Filter, page, sort, tab and open dialog come from the scope, never from local
      state. *Symptom: F5 and Back lose the state.*
- [ ] Every new view is registered in the catalog. *Symptom: blank screen.*
- [ ] The "loading" over a list only appears after a threshold, and in the theme's color.
      *Symptom: a flash over the rows on every fast reload.*
- [ ] Solid: reads `props.scope.x` directly (does not destructure, which kills
      reactivity); `ObservableArray` with spread in `<For>`.
- [ ] React: named export, `FCClass` + `classToFComponent`, handlers as fields.

## Tree and files

- [ ] The module's folder is its position in the tree; what only exists inside a screen
      lives inside its folder.
- [ ] A component (no place) stays outside the screen modules; a generic (several places)
      likewise.
- [ ] Mounts of a generic are mutually exclusive (none an ancestor of another).
- [ ] The generic's `mount` is an abstract getter.

## Test

- [ ] There is a no-DOM test for the new path, starting from cold start (pasted link).
- [ ] Uses `settle()`, not `sleep`.
- [ ] Asserts the scope AND `history.token`.
- [ ] Fails loudly on an action error (`unexpected` wrapped).
