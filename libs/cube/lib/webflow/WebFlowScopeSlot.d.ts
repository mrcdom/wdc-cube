import type { WebFlowScope } from './WebFlowScope';
export interface WebFlowScopeSlot {
    (scope?: WebFlowScope): void;
}
