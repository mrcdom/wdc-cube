import React from 'react';
import { Scope, Application, FlipIntent } from 'wdc-cube';
type ReactType = typeof React;
export declare function bindUpdate<S extends Scope>(reactRef: unknown, scope: S): S;
type IApplication<S extends Scope> = Application & {
    scope: S;
    applyParameters(intent: FlipIntent, initialization: boolean, deepest?: boolean): Promise<boolean>;
};
export declare function getOrCreateApplication<S extends Scope, A extends IApplication<S>>(react: ReactType, factory: () => A): A;
export {};
