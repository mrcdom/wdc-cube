/**
 * Copyright © 2025 WeDoCode Consultoria e Soluções Avançadas LTDA. All rights reserved.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import type { Scope } from './Scope'

export interface ScopeSlot {
    (scope: Scope | undefined | null): void
}
