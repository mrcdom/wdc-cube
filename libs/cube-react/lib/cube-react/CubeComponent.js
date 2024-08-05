import { NOOP_VOID } from 'wdc-cube';
import { ReactComponent } from './ReactComponent';
export class CubeComponent extends ReactComponent {
    constructor() {
        super(...arguments);
        this.boundForceUpdate = this.forceUpdate.bind(this);
    }
    attached() {
        this.props.scope.forceUpdate = this.boundForceUpdate;
    }
    detached() {
        this.props.scope.forceUpdate = NOOP_VOID;
    }
}
//# sourceMappingURL=CubeComponent.js.map