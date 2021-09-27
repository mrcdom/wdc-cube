import React from 'react'
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

    public attached() {
        this.props.scope.forceUpdate = this.boundForceUpdate
    }

    public detached() {
        this.props.scope.forceUpdate = NOOP_VOID
    }

    private readonly boundForceUpdate = this.forceUpdate.bind(this)

}