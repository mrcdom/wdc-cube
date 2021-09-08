import React from 'react'

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