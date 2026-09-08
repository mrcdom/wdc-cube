# cube-showcase

An issue tracker — projects, a dashboard, a filterable list, a board you can drag
cards across, a table — built to answer one question: does the Cube architecture
hold up on something with real screens, a real backend and real latency, or only
on a tutorial?

**Live: <https://mrcdom.github.io/wdc-cube/>** — published from `master` by
[`.github/workflows/showcase.yml`](../../.github/workflows/showcase.yml).

Or locally:

```bash
pnpm install
pnpm compile
pnpm start:showcase   # http://localhost:3004
```

Sign in as anyone. There is no password, and the data is the same on every visit.

## The claim

**Everything the reader can change is a place, and the address bar is derived
from where the application is.**

Open the issue list, filter it to urgent, sort it, switch it to a board, page
through it, open an issue. The URL follows every one of those, Back undoes them
one at a time, a reload lands exactly where you were, and the link you copy opens
the same thing for someone else — including someone signed out, who is asked to
sign in and then sent on to it.

No code anywhere writes that URL. Each presenter answers `publishParameters`
with what it is showing, and the framework assembles the address from every
presenter that is currently alive. Which is why the issue dialog's URL carries
the project, the list's filters *and* the open issue: three presenters, each
publishing its own part, none of them aware of the others.

The corollary is the part worth stealing: a new intent is not empty. It starts
from where the application already is, so a screen that wants to go somewhere
with *less* has to say which parameters it is dropping. `Clear` learned that the
hard way — it built a fresh intent, set only the project, and did nothing at all,
because the intent came back holding the filters it meant to remove.

## Shape

```
api/            the data, the endpoints, the latency, and the worker that serves them
presentation/   places, keys, presenters, scopes, services — no view technology
renderer-solid/ SolidJS views, and the bootstrap
```

`presentation/` imports `wdc-cube` and nothing else. `renderer-solid/` holds only
views. And `api/` is a package rather than a folder inside the renderer because
answering HTTP is not a rendering concern: a second renderer of this showcase —
the point of the repository — should be able to have a backend without importing
the SolidJS project.

The API is real HTTP with real latency, answered by a Mock Service Worker instead
of a server, which is what lets the whole thing deploy as static files. That is
not decoration. A presenter that awaits a real request has to deal with a reader
who navigates away before the answer arrives; a presenter reading an array in
memory never does. Two defects here were exactly that, and neither was
reachable without the wait.

## The place tree

```
sign-in
project/                  the selected project: the door, the record, the people, the sidebar
    switch                choosing a different one
    dashboard
    issues/
        detail            the issue dialog, over the list it opened from
    cycles
```

Nesting says what a place stands *inside*, not how a reader got there. Issues
belong to a project rather than to the list of projects, so `project` is the
parent and holds what all of them have in common — checked once, fetched once,
and the sidebar written once instead of three times.

Two things fall out of that:

**A place that is only passed through stays out of the way.** `applyParameters`
receives `last`, and a place that is merely a segment on the way to a deeper one
returns without filling its slot or fetching anything. The issue list does the
opposite, and rightly: it *is* the backdrop its dialog opens over, so it draws
whether or not it is last. The difference is whether the deeper place stands on
this one or merely came through it.

**A parent does not await its own data.** The framework walks the path from the
root and awaits each step, so anything a parent waits for is time its children
have not started spending. `project` fires its request and hands the promise
down; the screen below joins it with `Promise.all`. Cold into a board, the
project, the people and the issues leave together.

## Things to look at

**The dashboard** ([`dashboard.presenter.ts`](presentation/src/modules/dashboard/dashboard.presenter.ts)).
Every figure is arithmetic over the issues, done in the presenter — including the
geometry of the ring, which arrives as an arc rather than as five numbers a view
would have to turn into one. A chart a view computes is a rule about the data
living in the drawing, and the next renderer would have to work it out again.

Colours go the other way. A bar says it counts `done`, not that it is green:
appearance is not a fact about a project, and the palette lives in the renderer.

Every figure is also a link, which is only possible because the filter it opens
is a place. The dashboard hands nothing over; it names where to go.

**The table** ([`v-issues-table.tsx`](renderer-solid/src/scripts/modules/issues/v-issues-table.tsx)).
TanStack Table v9 is the hard case, because it arrives wanting to own exactly
what the architecture says belongs elsewhere: the sort, the page, the filters. So
it is told not to. It gets `rowSortingFeature` *without* a sorted row model — it
learns that a column can be sorted and which one is, and never sorts anything —
and pagination is not asked for at all. What it does is what it is good at:
column definitions, header groups, cell rendering. What it does not do is
remember anything, because a sorted table has to be a link.

**The board** ([`dnd.ts`](renderer-solid/src/scripts/modules/issues/dnd.ts)).
Dragging is `@atlaskit/pragmatic-drag-and-drop`, and what crosses into the
presenter is an issue's id and a column's state — a fact about the data, not
about pointers. The row moves before the request is answered and moves back if it
fails, because the board is the one screen where the reader's hand is already
committed.

**Moving without navigating**
([`issues.presenter.ts`](presentation/src/modules/issues/issues.presenter.ts)).
Pressing `Board` does not leave the issue list, so there is nothing to flip to.
The presenter changes its own state and calls `updateHistory`, which rebuilds the
address from every live presenter and pushes it — so Back still works, without
walking the whole path from the root to arrive where it already was.

`at` is where the rows are, not where the reader is heading, and it becomes the
new state only once that state's rows are in hand. Two answers can be in the air
at once and the second one asked for is not always the second one back, so every
fetch takes a token and an overtaken answer says nothing.

## What it deliberately does not have

**Tests.** The tutorial beside it is where this repository holds its test
suite — one presentation-layer suite and one per renderer. The showcase is a
demonstration, and changes to it are verified in a browser.

**A server.** Pointing `ShowcaseService.baseUrl` at one is the whole of the
change if there is ever a reason to. The bootstrap already does exactly that,
for a smaller reason: a project site lives under `/wdc-cube/`, so both the
service and the worker are rooted at `import.meta.env.BASE_URL` rather than at
`/`. Absolute paths were what broke the first Pages build — the page asked for
`/wdc-cube/api/session`, a handler written as `/api/session` never fired, and
what came back was the page's own HTML.
