import { Logger } from '../utils/logger';
import { Comparators } from './Comparators';
const LOG = Logger.get('WebFlowNavigationContext');
export class WebFlowNavigationContext {
    constructor(app, targetUri) {
        this.__app = app;
        this.__level = 0;
        this.__sourceUri = app.newUri(app.lastPlace);
        this.__cycleDetectionMap = new Map();
        this.__presenterMap = new Map();
        this.__targetUri = targetUri;
        this.__cycleDetectionMap.set(this.targetUri.place.pathName, true);
        this.extractPresenters(this.__presenterMap, this.__sourceUri.place.path);
    }
    get targetUri() {
        return this.__targetUri;
    }
    set targetUri(uri) {
        if (this.__cycleDetectionMap.has(uri.place.pathName)) {
            throw new Error('Dectected a navigation cycle between '
                + `source(${this.__sourceUri})=>target(${this.__targetUri}). `
                + `The intermediate target was "${uri}"`);
        }
        this.__targetUri = uri;
        this.__cycleDetectionMap.set(uri.place.pathName, true);
    }
    get level() {
        return this.__level;
    }
    incrementAndGetLevel() {
        return ++this.__level;
    }
    extractPresenters(map, path) {
        for (const place of path) {
            const presenter = this.__app.getPresenter(place);
            if (presenter) {
                map.set(place.id, presenter);
            }
        }
    }
    async build(place, atLevel) {
        let result = false;
        if (this.__level === atLevel) {
            const deepest = this.__targetUri.place === place;
            const presenter = this.__presenterMap.get(place.id);
            if (presenter) {
                result = await presenter.applyParameters(this.__targetUri, false, deepest);
            }
            else {
                const presenter = place.factory(this.__app);
                this.__presenterMap.set(place.id, presenter);
                result = await presenter.applyParameters(this.__targetUri, true, deepest);
            }
            if (this.__level !== atLevel) {
                result = false;
            }
        }
        return result;
    }
    rollback() {
        for (const place of this.__sourceUri.place.path) {
            const presenter = this.__presenterMap.get(place.id);
            this.__presenterMap.delete(place.id);
            if (presenter != null) {
                presenter.applyParameters(this.__sourceUri, false, place === this.__sourceUri.place);
            }
            else {
                LOG.warn(`Missing presenter for ID=${place.id}`);
            }
        }
        if (this.__presenterMap.size > 0) {
            this.releasePresenters(this.__presenterMap);
            this.__presenterMap.clear();
        }
    }
    commit(newPresenterMap) {
        newPresenterMap.clear();
        for (const place of this.__targetUri.place.path) {
            const presenter = this.__presenterMap.get(place.id);
            if (presenter) {
                this.__presenterMap.delete(place.id);
                newPresenterMap.set(place.id, presenter);
                continue;
            }
            LOG.error(`No presenter for place=${place.toString()}`);
        }
        if (this.__presenterMap.size > 0) {
            this.releasePresenters(this.__presenterMap);
        }
        return newPresenterMap;
    }
    releasePresenters(presenterInstanceMap) {
        const presenterIds = [];
        for (const presenterId of presenterInstanceMap.keys()) {
            presenterIds.push(presenterId);
        }
        presenterIds.sort(Comparators.reverseOrderForNumber);
        for (const presenterId of presenterIds) {
            const presenter = presenterInstanceMap.get(presenterId);
            presenterInstanceMap.delete(presenterId);
            if (presenter != null) {
                try {
                    presenter.release();
                }
                catch (caught) {
                    LOG.error('Releasing presenter', caught);
                }
            }
        }
    }
}
//# sourceMappingURL=WebFlowNavigationContext.js.map