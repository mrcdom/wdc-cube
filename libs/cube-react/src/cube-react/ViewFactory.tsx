import React from 'react'
import { Scope, ScopeType } from 'wdc-cube'

export type IViewProps = {
    className?: string
    style?: React.CSSProperties
}

type IFactoryProps = IViewProps & {
    scope?: Scope
    optional?:boolean
}

export type IViewConstructor<P extends IFactoryProps> = React.ComponentClass<P> | React.FunctionComponent<P>

const elementFactoryMap: Map<ScopeType, IViewConstructor<IFactoryProps>> = new Map()

export function ViewSlot({ scope, optional = true, ...props }: IFactoryProps) {
    if (scope) {
        const ctor = elementFactoryMap.get(scope.constructor as ScopeType)
        if (ctor) {
            return React.createElement(ctor, { scope, ...props })
        } else {
            return <div className={props.className} style={props.style}>
                View({scope.constructor.name}) not found!
            </div>
        }
    } else if(!optional) {
        return <div className={props.className} style={props.style} />
    } else {
        return <></>
    }
}

export class ViewFactory {

    public static register<P extends IFactoryProps>(scopeConstructor: ScopeType, ctor: IViewConstructor<P>) {
        elementFactoryMap.set(scopeConstructor, ctor as IViewConstructor<IFactoryProps>)
    }

    public static createView(scope?: Scope, props?: IViewProps) {
        if (props) {
            return <ViewSlot scope={scope} {...props} />
        } else {
            return <ViewSlot scope={scope} />
        }
    }

}