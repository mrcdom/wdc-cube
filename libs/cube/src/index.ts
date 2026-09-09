/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

// :: Utils
export { Logger, type ILogger } from './impl/utils/Logger.js'
export { NOOP_VOID, NOOP_FALSE, NOOP_STRING, NOOP_PROMISE_VOID } from './impl/utils/EmptyFunctions.js'
export { ReflectionUtils } from './impl/utils/ReflectionUtils.js'
export { SingletonServices, type ServiceLike } from './impl/utils/SingletonServices.js'

// :: Cube
export { Place, type PlaceCreator } from './impl/Place.js'
export { FlipIntent } from './impl/FlipIntent.js'
export { HistoryManager } from './impl/HistoryManager.js'
export { PageHistoryManager } from './impl/PageHistoryManager.js'
export {
    action,
    defaultInstrumentation,
    Observable,
    observe,
    observedProperty,
    type FieldMetadata,
    type GenericObject,
    type ScopeInstrumentation
} from './impl/decorators/index.js'
export { Application } from './impl/Application.js'
export { Presenter } from './impl/Presenter.js'
export { CubePresenter } from './impl/CubePresenter.js'
export { ApplicationPresenter } from './impl/ApplicationPresenter.js'
export { Scope, type ScopeConstructor, type IScope } from './impl/Scope.js'
export { ScopeUtils } from './impl/ScopeUtils.js'
export { CubeBuilder, type CubeTree } from './impl/CubeBuilder.js'
export { createViewRegistry, type ViewRegistry } from './impl/ViewRegistry.js'
export { ObservableArray } from './impl/ObservableArray.js'
export { CallbackManager } from './impl/CallbackManager.js'
export { ScopeUpdateManager } from './impl/Presenter.js'

export type { ScopeSlot } from './impl/ScopeSlot.js'
export type { IPresenter, ICubePresenter, IPresenterOwner, IUpdateManager, AlertSeverity } from './impl/IPresenter.js'

// :: Conveniencias
export * as events from './events-react-compatible.js'
