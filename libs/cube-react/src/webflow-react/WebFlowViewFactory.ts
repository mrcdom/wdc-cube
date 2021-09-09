import React, { Attributes, ClassAttributes, HTMLAttributes, ReactElement } from 'react'
import { Logger, WebFlowScope } from 'wdc-cube'
import { WebFlowComponentProps } from './WebFlowComponent'

const LOG = Logger.get('WebFlowViewFactory')

export type IWebFlowViewProps<T> = ClassAttributes<T> & HTMLAttributes<T> & Attributes
export type IWebFlowViewConstructor<S extends WebFlowScope, T, P extends WebFlowComponentProps<S, T>> = React.ComponentClass<P>

type IViewFactory<S extends WebFlowScope, T, P extends WebFlowComponentProps<S, T>> = (scope?: WebFlowScope, props?: IWebFlowViewProps<T>) => ReactElement<P>

export class WebFlowViewFactory {

    private static readonly elementFactoryMap: Map<string, IViewFactory<WebFlowScope, unknown, WebFlowComponentProps<WebFlowScope, unknown>>> = new Map()

    public static register<S extends WebFlowScope, T, P extends WebFlowComponentProps<S, T>>(vid: string, ctor: IWebFlowViewConstructor<S, T, P>) {
        const factory: IViewFactory<WebFlowScope, unknown, WebFlowComponentProps<WebFlowScope, T>> = (scope, props) => {
            return React.createElement<P>(ctor, {...props, scope} as Attributes & P)
        }
        
        WebFlowViewFactory.elementFactoryMap.set(vid, factory)
    }

    public static createView<T = unknown>(scope?: WebFlowScope, props?: IWebFlowViewProps<T>) {
        if (scope) {
            const factory = WebFlowViewFactory.elementFactoryMap.get(scope.id)
            if (factory) {
                return factory(scope, props)
            } else {
                LOG.warn(`No view factory found for scope.id=${scope.id}`)
            }
        }
        return undefined
    }

}