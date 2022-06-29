import { createBrowserHistory, createHashHistory } from 'history';
import { HistoryManager } from 'wdc-cube';
export class PageHistoryManager extends HistoryManager {
    constructor(useHash = false) {
        super();
        this.__history = useHash ? createHashHistory() : createBrowserHistory();
        this.__history.listen(this.emitOnChanged.bind(this));
    }
    get location() {
        const location = this.__history.location;
        return location.pathname + location.search;
    }
    update(app, place) {
        this.clearDebounceHandler();
        this.__debounceHandler = setTimeout(this.doUpdate.bind(this, app, place), 16);
    }
    clearDebounceHandler() {
        if (this.__debounceHandler) {
            clearTimeout(this.__debounceHandler);
            this.__debounceHandler = undefined;
        }
    }
    doUpdate(app, place) {
        const currentUri = app.newFlipIntent(place);
        const oldLocation = this.__history.location;
        const qs = currentUri.getQueryString();
        const newLocation = {
            pathname: place.name,
            search: qs ? '?' + currentUri.getQueryString() : '',
            hash: ''
        };
        if (newLocation.pathname !== oldLocation.pathname || newLocation.search !== oldLocation.search) {
            this.__history.push(newLocation);
        }
    }
    emitOnChanged() {
        this.notifyChanges();
    }
}
//# sourceMappingURL=PageHistoryManager.js.map