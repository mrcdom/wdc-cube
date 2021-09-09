import { NOOP_VOID } from './Constants';
export class WebFlowPresenter {
    constructor(app, scope) {
        this.app = app;
        this.scope = scope;
    }
    release() {
        this.scope.update = NOOP_VOID;
    }
    async applyParameters(uri, initialization, deepest) {
        return true;
    }
    computeDerivatedFields() {
    }
    publishParameters(uri) {
    }
}
export function newPresenterFactory(ctor) {
    return (app) => {
        return new ctor(app);
    };
}
//# sourceMappingURL=WebFlowPresenter.js.map