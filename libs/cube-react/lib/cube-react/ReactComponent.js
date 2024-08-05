import React from 'react';
export class ReactComponent extends React.Component {
    UNSAFE_componentWillMount() {
        this.attached();
    }
    componentWillUnmount() {
        this.detached();
    }
    attached() {
    }
    detached() {
    }
}
//# sourceMappingURL=ReactComponent.js.map