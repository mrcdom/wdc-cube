import React from 'react';
import { Scope, ScopeConstructor } from 'wdc-cube';
export declare type IViewProps = {
    className?: string;
    style?: React.CSSProperties;
};
export declare type IViewConstructor<P extends IFactoryProps> = React.ComponentClass<P> | React.FunctionComponent<P>;
declare type IFactoryProps = IViewProps & {
    scope?: Scope;
};
declare type ViewSlotProps<P extends IFactoryProps, S extends Scope> = IViewProps & {
    scope?: S | null;
    optional?: boolean;
    view?: IViewConstructor<P>;
};
export declare function ViewSlot<P extends IFactoryProps, S extends Scope>({ scope, optional, view, ...props }: ViewSlotProps<P, S>): JSX.Element;
export declare class ViewFactory {
    static register<P extends IFactoryProps>(scopeCtor: ScopeConstructor, viewCtor: IViewConstructor<P>): void;
    static get(scope?: Scope): IViewConstructor<IFactoryProps> | undefined;
    static createView(scope?: Scope, props?: IViewProps): JSX.Element;
}
export {};
