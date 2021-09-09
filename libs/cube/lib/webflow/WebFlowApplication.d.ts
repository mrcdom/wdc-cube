import { WebFlowPlace } from './WebFlowPlace';
import { WebFlowURI } from './WebFlowURI';
import { WebFlowHistoryManager } from './WebFlowHistoryManager';
export declare class WebFlowApplication {
    private __placeMap;
    private __presenterMap;
    private __lastPlace;
    private __fragment?;
    private __historyManager;
    private __navigationContext?;
    constructor(historyManager: WebFlowHistoryManager);
    release(): void;
    get historyManager(): WebFlowHistoryManager;
    get lastPlace(): WebFlowPlace;
    get fragment(): string | undefined;
    publishParameters(uri: WebFlowURI): void;
    commitComputedFields(): void;
    newUri(place: WebFlowPlace): WebFlowURI;
    updateHistory(): void;
    getPresenter(place: WebFlowPlace): import("./WebFlowPresenter").WebFlowPresenterType | undefined;
    protected catalogPlaces(places: Record<string, WebFlowPlace>): void;
    navigate(uri: WebFlowURI | string, fallbackPlace?: WebFlowPlace): Promise<void>;
    protected doNavigate(uri: WebFlowURI): Promise<void>;
    protected onHistoryChanged(sender: WebFlowHistoryManager): void;
    protected onBeforeNavigation(uri: WebFlowURI): void;
}
