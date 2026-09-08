/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import type { Type } from '@angular/core'
import { createViewRegistry, type Scope, type ScopeConstructor } from 'wdc-cube'

/** A component that draws a scope. It must accept a `scope` input. */
export type CubeViewType = Type<unknown>

const registry = createViewRegistry<CubeViewType>('wdc-cube-angular:view')

export class ViewFactory {
    /** Pairs a scope class with the component that draws it. */
    public static register(scopeCtor: ScopeConstructor, view: CubeViewType): void {
        registry.register(scopeCtor, view)
    }

    /** The component registered for this scope's class, if any. */
    public static get(scope?: Scope | null): CubeViewType | undefined {
        return registry.get(scope)
    }
}
