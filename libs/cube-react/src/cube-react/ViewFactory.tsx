import React from 'react'
import { Scope, ScopeConstructor } from 'wdc-cube'

export type IViewProps = {
    className?: string
    style?: React.CSSProperties
}

export type IViewConstructor<P extends IFactoryProps> = React.ComponentClass<P> | React.FunctionComponent<P>

type IFactoryProps = IViewProps & {
    scope?: Scope
}

const elementFactoryMap: Map<ScopeConstructor, IViewConstructor<IFactoryProps>> = new Map()

type ViewSlotProps<P extends IFactoryProps, S extends Scope> = IViewProps & {
    scope?: S
    optional?: boolean
    view?: IViewConstructor<P>
}

export function ViewSlot<P extends IFactoryProps, S extends Scope>({ scope, optional = true, view, ...props }: ViewSlotProps<P, S>) {
    if (scope) {
        if (view) {
            const ctor = view as IViewConstructor<IFactoryProps>
            return React.createElement(ctor, { scope, ...props })
        }

        const ctor = elementFactoryMap.get(scope.constructor as ScopeConstructor)
        if (ctor) {
            return React.createElement(ctor, { scope, ...props })
        }

        return <div className={props.className} style={props.style}>
            View({scope.constructor.name}) not found!
        </div>
    } else if (!optional) {
        return <div className={props.className} style={props.style} />
    } else {
        return <></>
    }
}

export class ViewFactory {

    public static register<P extends IFactoryProps>(scopeConstructor: ScopeConstructor, ctor: IViewConstructor<P>) {
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