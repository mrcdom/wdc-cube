import React from 'react';
import { Scope, Application, FlipIntent } from 'wdc-cube';
declare type ReactType = typeof React;
export declare function bindUpdate<S extends Scope>(react: ReactType, scope: S): void;
declare type IApplication<S extends Scope> = Application & {
    scope: S;
    applyParameters(intent: FlipIntent, initialization: boolean, deepest?: boolean): Promise<boolean>;
};
export declare function getOrCreateApplication<S extends Scope, A extends IApplication<S>>(react: ReactType, factory: () => A): A;
export {};
