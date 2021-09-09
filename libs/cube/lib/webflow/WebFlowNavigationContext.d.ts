import { WebFlowPlace } from './WebFlowPlace';
import { WebFlowURI } from './WebFlowURI';
import { WebFlowApplication } from './WebFlowApplication';
import type { WebFlowPresenterMapType } from './WebFlowPresenter';
export declare class WebFlowNavigationContext {
    private __app;
    private __presenterMap;
    private __sourceUri;
    private __targetUri;
    private __level;
    private __cycleDetectionMap;
    constructor(app: WebFlowApplication, targetUri: WebFlowURI);
    get targetUri(): WebFlowURI;
    set targetUri(uri: WebFlowURI);
    get level(): number;
    incrementAndGetLevel(): number;
    private extractPresenters;
    build(place: WebFlowPlace, atLevel: number): Promise<boolean>;
    rollback(): void;
    commit(newPresenterMap: WebFlowPresenterMapType): WebFlowPresenterMapType;
    private releasePresenters;
}
