/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

export { ReactComponent } from './impl/ReactComponent.js'
export { bindUpdate, getOrCreateApplication } from './impl/ReactFunctionalComponent.js'
export { CubeComponent } from './impl/CubeComponent.js'
export { ViewFactory, ViewSlot } from './impl/ViewFactory.js'
export { CubeRefObject } from './impl/CubeRefObject.js'
export { classToFComponent, FCClass, type FCClassContext, type ScopeOf } from './impl/ReactFunctionalClass.js'

export type { CubeComponentProps } from './impl/CubeComponent.js'
export type { IViewProps } from './impl/ViewFactory.js'
