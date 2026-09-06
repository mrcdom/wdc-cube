/**
 * Cross-cutting entry points. Everything tied to one module lives behind its own
 * subpath — `wdc-cube-tutorial-core/todo-mvc`, and so on — because scope names
 * repeat across modules (`MainScope` exists in both main and todo-mvc) and a
 * single flat barrel could not carry them.
 */

export { ParamIds, AttrIds, Places } from './modules/RouteConsts'
export { initialize as initializeRoutes } from './modules/Routes'
export { registerServices, TutorialService } from './services'
export type { SiteItemType, TodoType } from './services/TutorialService'
