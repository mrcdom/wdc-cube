import type { Scope } from './Scope'

export interface ScopeSlot {
    (scope?: Scope | null): void
}
