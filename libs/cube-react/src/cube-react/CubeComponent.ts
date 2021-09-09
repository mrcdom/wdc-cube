import { ClassAttributes, HTMLAttributes } from 'react'
import { Scope, NOOP_VOID } from 'wdc-cube'
import { ReactComponent } from './ReactComponent'

export type CubeComponentProps<S extends Scope, T = unknown> = ClassAttributes<T> & HTMLAttributes<T> & {
    scope: S
}

export class CubeComponent<SC extends Scope, T = unknown, P extends CubeComponentProps<SC, T> = { scope: SC }, S = unknown, SS = unknown> extends ReactComponent<P, S, SS> {

    public constructor(props: P) {
        super(props)
    }

    public attached() {
        this.props.scope.update = this.newUpdateCallback()
    }

    public detached() {
        this.props.scope.update = NOOP_VOID
    }

}