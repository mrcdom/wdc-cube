import React from 'react';
import { Scope } from 'wdc-cube';
import { ReactComponent } from './ReactComponent';
export type CubeComponentProps<S extends Scope> = {
    key?: React.Key;
    className?: string;
    style?: React.CSSProperties;
    scope: S;
};
export declare class CubeComponent<SC extends Scope, P extends CubeComponentProps<SC> = {
    scope: SC;
}, S = unknown, SS = unknown> extends ReactComponent<P, S, SS> {
    attached(): void;
    detached(): void;
    private readonly boundForceUpdate;
}
