/**
 * The other side of the boundary.
 *
 * `ShowcaseService` makes ordinary HTTP calls and knows nothing about what
 * answers them. This package is what answers them in the demo: the data the
 * showcase runs on, the endpoints, the latency, and the worker that intercepts
 * the requests so the whole thing deploys as static files.
 *
 * It lives beside the renderers rather than inside one because it is not a
 * rendering concern. A second renderer of this showcase — the point of the
 * repository — would have had to import the SolidJS project to get a backend,
 * or keep its own copy of the seed and disagree with it.
 *
 * The types it speaks come from the presentation layer's `domain`, which is the
 * contract as the client states it. A mock implementing the client's contract
 * is the right direction: nothing here is imported back the other way.
 */

export { startFakeApi } from './start'
export { handlers } from './handlers'
export { buildDataset, MEMBERS, type Dataset } from './seed'
