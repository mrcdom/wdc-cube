/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

// :: Utils
export { Logger, type ILogger } from './impl/utils/Logger'
export { NOOP_VOID, NOOP_FALSE, NOOP_STRING, NOOP_PROMISE_VOID } from './impl/utils/EmptyFunctions'
export { ReflectionUtils } from './impl/utils/ReflectionUtils'
export { SingletonServices, type ServiceLike } from './impl/utils/SingletonServices'

// :: Cube
export { Place, type PlaceCreator } from './impl/Place'
export { FlipIntent } from './impl/FlipIntent'
export { HistoryManager } from './impl/HistoryManager'
export { PageHistoryManager } from './impl/PageHistoryManager'
export { action, Observable, observe } from './impl/decorators'
export { Application } from './impl/Application'
export { Presenter } from './impl/Presenter'
export { CubePresenter } from './impl/CubePresenter'
export { ApplicationPresenter } from './impl/ApplicationPresenter'
export { Scope, type ScopeConstructor, type IScope } from './impl/Scope'
export { ScopeUtils } from './impl/ScopeUtils'
export { CubeBuilder, type CubeTree } from './impl/CubeBuilder'
export { createViewRegistry, type ViewRegistry } from './impl/ViewRegistry'
export { ObservableArray } from './impl/ObservableArray'
export { CallbackManager } from './impl/CallbackManager'
export { ScopeUpdateManager } from './impl/Presenter'

export type { ScopeSlot } from './impl/ScopeSlot'
export type { IPresenter, ICubePresenter, IPresenterOwner, IUpdateManager, AlertSeverity } from './impl/IPresenter'

// :: Conveniencias
export * as events from './events-react-compatible'
