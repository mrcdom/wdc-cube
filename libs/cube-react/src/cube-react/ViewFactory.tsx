import React from 'react'
import lodash from 'lodash'
import { Scope } from 'wdc-cube'

export type IViewProps = {
    className?: string
    style?: React.CSSProperties
}

type IFactoryProps = IViewProps & {
    scope?: Scope
}

export type IViewConstructor<P extends IFactoryProps> = React.ComponentClass<P> | React.FunctionComponent<P>

const elementFactoryMap: Map<string, IViewConstructor<IFactoryProps>> = new Map()

export function ViewSlot({ scope, ...props }: IFactoryProps) {
    if (scope) {
        const ctor = elementFactoryMap.get(scope.vid)
        if (ctor) {
            return React.createElement(ctor, { scope, ...props })
        } else {
            return <div className={props.className} style={props.style}>
                View({scope.vid}) not found!
            </div>
        }
    } else {
        return <></>
    }
}

export class ViewFactory {

    public static register<P extends IFactoryProps>(vid: string, ctor: IViewConstructor<P>) {
        elementFactoryMap.set(vid, ctor as IViewConstructor<IFactoryProps>)
    }

    public static createView(scope?: Scope, props?: IViewProps) {
        if (props) {
            return <ViewSlot scope={scope} {...props} />
        } else {
            return <ViewSlot scope={scope} />
        }
    }

}

