import React from 'react';
import { Scope, ScopeConstructor } from 'wdc-cube';
export type IViewProps = {
    className?: string;
    style?: React.CSSProperties;
};
export type IViewConstructor<P extends IFactoryProps> = React.ComponentClass<P> | React.FunctionComponent<P>;
type IFactoryProps = IViewProps & {
    scope?: Scope;
};
type ViewSlotProps<P extends IFactoryProps, S extends Scope> = IViewProps & {
    scope?: S | null;
    optional?: boolean;
    view?: IViewConstructor<P>;
};
export declare function ViewSlot<P extends IFactoryProps, S extends Scope>({ scope, optional, view, ...props }: ViewSlotProps<P, S>): import("react/jsx-runtime").JSX.Element;
export declare class ViewFactory {
    static register<P extends IFactoryProps>(scopeCtor: ScopeConstructor, viewCtor: IViewConstructor<P>): void;
    static get(scope?: Scope): IViewConstructor<IFactoryProps> | undefined;
    static createView(scope?: Scope, props?: IViewProps): import("react/jsx-runtime").JSX.Element;
}
export {};
