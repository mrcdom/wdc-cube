import React from 'react';
export declare class ReactComponent<P = unknown, S = unknown, SS = any> extends React.Component<P, S, SS> {
    UNSAFE_componentWillMount(): void;
    componentWillUnmount(): void;
    protected attached(): void;
    protected detached(): void;
}
