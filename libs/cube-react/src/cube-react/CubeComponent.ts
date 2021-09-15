import React from 'react'
import lodash from 'lodash'
import { Scope, NOOP_VOID } from 'wdc-cube'
import { ReactComponent } from './ReactComponent'

export type CubeComponentProps<S extends Scope> = {
    key?: React.Key
    className?: string
    style?: React.CSSProperties
    scope: S
}

export class CubeComponent<
    SC extends Scope, 
    P extends CubeComponentProps<SC> = { scope: SC }, 
    S = unknown, 
    SS = unknown
> extends ReactComponent<P, S, SS> {

    public constructor(props: P) {
        super(props)
    }

    public attached() {
        this.props.scope.update = this.boundForceUpdate
    }

    public detached() {
        this.props.scope.update = NOOP_VOID
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public shouldComponentUpdate(nextProps: Readonly<P>, nextState: Readonly<S>, nextContext: any): boolean {
        if (this.props.scope !== nextProps.scope) {
            return true
        }

        if (!lodash.isEqual(this.props.scope, nextProps.scope)) {
            return true
        }

        if (this.props.className !== nextProps.className) {
            return true
        }

        if (!lodash.isEqual(this.props.style, nextProps.style)) {
            return true
        }

        if (super.shouldComponentUpdate) {
            return super.shouldComponentUpdate(nextProps, nextState, nextContext)
        } else {
            return false
        }
    }

    private boundForceUpdate = this.forceUpdate.bind(this)

}