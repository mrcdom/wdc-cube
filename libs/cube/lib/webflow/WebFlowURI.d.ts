import { WebFlowPlace } from './WebFlowPlace';
import type { WebFlowScopeSlot } from './WebFlowScopeSlot';
export declare class WebFlowURI extends Object {
    static parse(placeStr: string, stepProvider?: (name: string) => WebFlowPlace): WebFlowURI;
    readonly place: WebFlowPlace;
    private parameters;
    readonly attributes: Map<string, unknown>;
    constructor(step: WebFlowPlace);
    getParameterRawValue(name: string): unknown;
    getParameterValue(name: string): unknown;
    getParameterValues(name: string): Array<unknown>;
    getParameterAsString(name: string): string | undefined;
    getParameterAsStringOrDefault(name: string, defaultValue: string): string;
    getParameterAsNumber(name: string): number | undefined;
    getParameterAsNumberOrDefault(name: string, defaultValue: number): number;
    getParameterAsBoolean(name: string): boolean | undefined;
    getParameterAsBooleanOrDefault(name: string, defaultValue: boolean): boolean;
    setParameter(name: string, value?: null | string | number | boolean | string[] | number[] | boolean[]): void;
    getQueryString(): string;
    toString(): string;
    setScopeSlot(slotId: string, slot: WebFlowScopeSlot): void;
    getScopeSlot(slotId: string): WebFlowScopeSlot;
}
