/**
 * Cross-cutting entry points. Everything tied to one module lives behind its own
 * subpath — `wdc-cube-showcase-presentation/issues`, and so on — because scope
 * names repeat across modules and a single flat barrel could not carry them.
 */

export { AttrIds, ParamIds, Places } from './modules/RouteConsts'
export { initialize as initializeRoutes } from './modules/Routes'
export { registerServices, ShowcaseService } from './services'
