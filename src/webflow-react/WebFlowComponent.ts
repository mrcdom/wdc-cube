import React, { ClassAttributes, HTMLAttributes } from 'react'
import { WebFlowScope, NOOP_VOID } from '../webflow'
import { ReactComponent } from './ReactComponent'

export type WebFlowComponentProps<Scope extends WebFlowScope, T> = ClassAttributes<T> & HTMLAttributes<T> & {
    scope: Scope
}

export class WebFlowComponent<Scope extends WebFlowScope, T = unknown, P extends WebFlowComponentProps<Scope, T> = { scope: Scope }, S = unknown, SS = unknown> extends ReactComponent<P, S, SS> {

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