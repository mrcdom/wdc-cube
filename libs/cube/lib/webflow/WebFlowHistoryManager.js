import { NOOP_STRING } from './Constants';
const NOPP_ONCHANGE_LISTENER = (sender) => {
};
export class WebFlowHistoryManager {
    constructor() {
        this.onChangeListener = NOPP_ONCHANGE_LISTENER;
        this.__tokenProvider = NOOP_STRING;
    }
    get tokenProvider() {
        return this.__tokenProvider;
    }
    set tokenProvider(provider) {
        this.__tokenProvider = provider;
    }
    get location() {
        return '';
    }
    update() {
    }
}
WebFlowHistoryManager.NOOP = new WebFlowHistoryManager();
//# sourceMappingURL=WebFlowHistoryManager.js.map