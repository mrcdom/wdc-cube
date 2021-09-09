import React, { Attributes, ClassAttributes, HTMLAttributes, ReactElement } from 'react'
import { Logger, Scope } from 'wdc-cube'
import { CubeComponentProps } from './CubeComponent'

const LOG = Logger.get('ViewFactory')

export type IViewProps<T> = ClassAttributes<T> & HTMLAttributes<T> & Attributes
export type IViewConstructor<S extends Scope, T, P extends CubeComponentProps<S, T>> = React.ComponentClass<P>

type IViewFactory<S extends Scope, T, P extends CubeComponentProps<S, T>> = (scope?: Scope, props?: IViewProps<T>) => ReactElement<P>

export class ViewFactory {

    private static readonly elementFactoryMap: Map<string, IViewFactory<Scope, unknown, CubeComponentProps<Scope, unknown>>> = new Map()

    public static register<S extends Scope, T, P extends CubeComponentProps<S, T>>(vid: string, ctor: IViewConstructor<S, T, P>) {
        const factory: IViewFactory<Scope, unknown, CubeComponentProps<Scope, T>> = (scope, props) => {
            return React.createElement<P>(ctor, {...props, scope} as Attributes & P)
        }
        
        ViewFactory.elementFactoryMap.set(vid, factory)
    }

    public static createView<T = unknown>(scope?: Scope, props?: IViewProps<T>) {
        if (scope) {
            const factory = ViewFactory.elementFactoryMap.get(scope.id)
            if (factory) {
                return factory(scope, props)
            } else {
                LOG.warn(`No view factory found for scope.id=${scope.id}`)
            }
        }
        return undefined
    }

}