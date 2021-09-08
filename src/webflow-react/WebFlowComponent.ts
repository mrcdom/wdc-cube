import React, { ClassAttributes, HTMLAttributes } from 'react'
import { WebFlowScope, NOOP_VOID } from '../webflow'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class ReactComponent<P = unknown, S = unknown, SS = any> extends React.Component<P, S, SS> {

    public override UNSAFE_componentWillMount() {
        this.attached()
    }

    public override componentWillUnmount(): void {
        this.detached()
    }

    protected attached() {
        // NOOP
    }

    protected detached() {
        // NOOP
    }

    protected newUpdateCallback(): () => void {
        const doUpdate = () => {
            this.forceUpdate()
        }

        let debounceHandler: NodeJS.Timeout | undefined = undefined
        return () => {
            if (debounceHandler) {
                clearTimeout(debounceHandler)
                debounceHandler = undefined
            }

            debounceHandler = setTimeout(doUpdate, 16)
        }
    }

}

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