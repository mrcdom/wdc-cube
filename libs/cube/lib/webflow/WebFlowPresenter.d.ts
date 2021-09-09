import { WebFlowApplication } from './WebFlowApplication';
import { WebFlowURI } from './WebFlowURI';
import type { WebFlowScope } from './WebFlowScope';
export declare type WebFlowPresenterType = WebFlowPresenter<WebFlowApplication, WebFlowScope>;
export declare type WebFlowPresenterMapType = Map<number, WebFlowPresenterType>;
export declare type WebFlowPresenterContructor<A extends WebFlowApplication> = {
    new (app: A): WebFlowPresenterType;
};
export declare type WebFlowPresenterFactory = (app: WebFlowApplication) => WebFlowPresenterType;
export declare class WebFlowPresenter<Application extends WebFlowApplication, Scope extends WebFlowScope> {
    protected readonly app: Application;
    readonly scope: Scope;
    constructor(app: Application, scope: Scope);
    release(): void;
    applyParameters(uri: WebFlowURI, initialization: boolean, deepest: boolean): Promise<boolean>;
    computeDerivatedFields(): void;
    publishParameters(uri: WebFlowURI): void;
}
export declare function newPresenterFactory<A extends WebFlowApplication>(ctor: WebFlowPresenterContructor<A>): WebFlowPresenterFactory;
