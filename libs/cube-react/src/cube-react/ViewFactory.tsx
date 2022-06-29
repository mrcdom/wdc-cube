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

type ViewSlotProps<P extends IFactoryProps, S extends Scope> = IViewProps & {
    scope?: S | null
    optional?: boolean
    view?: IViewConstructor<P>
}

export function ViewSlot<P extends IFactoryProps, S extends Scope>({
    scope,
    optional = true,
    view,
    ...props
}: ViewSlotProps<P, S>) {
    if (scope) {
        if (view) {
            const ctor = view as IViewConstructor<IFactoryProps>
            return React.createElement(ctor, { scope, ...props })
        }

        const ctor = ViewFactory.get(scope)
        if (ctor) {
            return React.createElement(ctor, { scope, ...props })
        }

        return (
            <div className={props.className} style={props.style}>
                {'View({scope.constructor.name}) not found!'}
            </div>
        )
    } else if (!optional) {
        return <div className={props.className} style={props.style} />
    } else {
        return <></>
    }
}

const VIEW_PROP_SYM = Symbol('VIEW')

export class ViewFactory {
    // Static API

    public static register<P extends IFactoryProps>(scopeCtor: ScopeConstructor, viewCtor: IViewConstructor<P>) {
        const dynScopeCtor = scopeCtor as unknown as Record<string | symbol, unknown>
        dynScopeCtor[VIEW_PROP_SYM] = viewCtor
    }

    public static get(scope?: Scope) {
        if (scope && scope.constructor) {
            const dynScopeCtor = scope.constructor as unknown as Record<string | symbol, unknown>
            return dynScopeCtor[VIEW_PROP_SYM] as IViewConstructor<IFactoryProps>
        } else {
            return undefined
        }
    }

    public static createView(scope?: Scope, props?: IViewProps) {
        if (props) {
            return <ViewSlot scope={scope} {...props} />
        } else {
            return <ViewSlot scope={scope} />
        }
    }
}
