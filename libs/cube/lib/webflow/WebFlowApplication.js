import { Logger } from '../utils/logger';
import { Comparators } from './Comparators';
import { CastUtils } from './CastUtils';
import { WebFlowPlace } from './WebFlowPlace';
import { WebFlowURI } from './WebFlowURI';
import { WebFlowNavigationContext } from './WebFlowNavigationContext';
const LOG = Logger.get('WebFlowApplication');
export class WebFlowApplication {
    constructor(historyManager) {
        this.__lastPlace = WebFlowPlace.UNKNOWN;
        this.__historyManager = historyManager;
        this.__presenterMap = new Map();
        this.__placeMap = new Map();
        historyManager.tokenProvider = () => this.newUri(this.__lastPlace).toString();
        historyManager.onChangeListener = this.onHistoryChanged.bind(this);
    }
    release() {
        const presenterIds = [];
        for (const id of this.__presenterMap.keys()) {
            presenterIds.push(id);
        }
        presenterIds.sort(Comparators.reverseOrderForNumber);
        for (const presenterId of presenterIds) {
            const presenter = this.__presenterMap.get(presenterId);
            if (presenter) {
                this.__presenterMap.delete(presenterId);
                try {
                    presenter.release();
                }
                catch (caught) {
                    LOG.error(`Releasing presenter ${presenter.constructor.name}`, caught);
                }
            }
        }
        this.__presenterMap.clear();
    }
    get historyManager() {
        return this.__historyManager;
    }
    get lastPlace() {
        return this.__lastPlace;
    }
    get fragment() {
        return this.__fragment;
    }
    publishParameters(uri) {
        for (const presenter of this.__presenterMap.values()) {
            presenter.publishParameters(uri);
        }
    }
    commitComputedFields() {
        for (const presenter of this.__presenterMap.values()) {
            try {
                presenter.computeDerivatedFields();
            }
            catch (caught) {
                LOG.error(`Processing ${presenter.constructor.name}.commitComputedState()`, caught);
            }
        }
    }
    newUri(place) {
        const uri = new WebFlowURI(place);
        this.publishParameters(uri);
        return uri;
    }
    updateHistory() {
        this.historyManager.update();
    }
    getPresenter(place) {
        return this.__presenterMap.get(place.id);
    }
    catalogPlaces(places) {
        for (const place of Object.values(places)) {
            this.__placeMap.set(place.name, place);
        }
    }
    async navigate(uri, fallbackPlace = WebFlowPlace.UNKNOWN) {
        if (CastUtils.isInstanceOf(uri, String)) {
            let suri = uri;
            if (!suri) {
                suri = fallbackPlace.name;
            }
            const placeProvider = (name) => {
                const place = this.__placeMap.get(name);
                return place !== null && place !== void 0 ? place : WebFlowPlace.createUnbunded(name);
            };
            uri = WebFlowURI.parse(suri, placeProvider);
            if (uri.place.id == -1) {
                throw new Error(`No place found under name=${uri.place.name}`);
            }
            await this.doNavigate(uri);
        }
        else {
            await this.doNavigate(uri);
        }
    }
    async doNavigate(uri) {
        this.onBeforeNavigation(uri);
        if (this.__navigationContext) {
            const context = this.__navigationContext;
            const level = context.incrementAndGetLevel();
            context.targetUri = uri;
            for (const place of uri.place.path) {
                if (!(await context.build(place, level))) {
                    break;
                }
            }
        }
        else {
            const context = new WebFlowNavigationContext(this, uri);
            try {
                this.__navigationContext = context;
                for (const place of uri.place.path) {
                    if (!(await context.build(place, 0))) {
                        break;
                    }
                }
                context.commit(this.__presenterMap);
                this.__lastPlace = context.targetUri.place;
                this.commitComputedFields();
            }
            catch (caught) {
                context.rollback();
                throw caught;
            }
            finally {
                this.__navigationContext = undefined;
                this.updateHistory();
            }
        }
    }
    onHistoryChanged(sender) {
        if (!this.__navigationContext) {
            this.navigate(sender.location, this.lastPlace);
        }
    }
    onBeforeNavigation(uri) {
    }
}
//# sourceMappingURL=WebFlowApplication.js.map