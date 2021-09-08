import React, { ClassAttributes, HTMLAttributes } from 'react'
import Logger from '../utils/logger'
import { WebFlowScope } from '../webflow2'
import { WebFlowComponentProps } from './WebFlowComponent'

const LOG = Logger.get('WebFlowViewFactory')

export type IWebFlowViewProps<T> = ClassAttributes<T> & HTMLAttributes<T>
export type IWebFlowViewConstructor<S extends WebFlowScope, T, P extends WebFlowComponentProps<S, T>> = React.ComponentClass<P>

export class WebFlowViewFactory {

    private static readonly elementFactoryMap: Map<string, React.Factory<WebFlowComponentProps<WebFlowScope, unknown>>> = new Map()

    public static register<S extends WebFlowScope, T, P extends WebFlowComponentProps<S, T>>(vid: string, ctor: IWebFlowViewConstructor<S, T, P>) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        WebFlowViewFactory.elementFactoryMap.set(vid, React.createFactory<any>(ctor))
    }

    public static createView<T = unknown>(scope?: WebFlowScope, props?: IWebFlowViewProps<T>) {
        if (scope) {
            const factory = WebFlowViewFactory.elementFactoryMap.get(scope.id)
            if (factory) {
                return factory({ ...props, scope })
            } else {
                LOG.warn(`No view factory found for scope.id=${scope.id}`)
            }
        }
        return undefined
    }

}