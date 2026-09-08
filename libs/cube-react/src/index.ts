/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

export { ReactComponent } from './impl/ReactComponent'
export { bindUpdate, getOrCreateApplication } from './impl/ReactFunctionalComponent'
export { CubeComponent } from './impl/CubeComponent'
export { ViewFactory, ViewSlot } from './impl/ViewFactory'
export { CubeRefObject } from './impl/CubeRefObject'
export { classToFComponent, FCClass, type FCClassContext, type ScopeOf } from './impl/ReactFunctionalClass'

export type { CubeComponentProps } from './impl/CubeComponent'
export type { IViewProps } from './impl/ViewFactory'
