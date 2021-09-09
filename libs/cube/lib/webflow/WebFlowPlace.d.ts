import { WebFlowApplication } from './WebFlowApplication';
import type { WebFlowPresenterContructor, WebFlowPresenterFactory } from './WebFlowPresenter';
export declare class WebFlowPlace {
    readonly name: string;
    readonly parent?: WebFlowPlace | undefined;
    readonly factory: WebFlowPresenterFactory;
    static createUnbunded(name: string): WebFlowPlace;
    static UNKNOWN: WebFlowPlace;
    static create<A extends WebFlowApplication>(name: string, ctor: WebFlowPresenterContructor<A>, parent?: WebFlowPlace): WebFlowPlace;
    readonly id: number;
    readonly pathName: string;
    readonly path: WebFlowPlace[];
    constructor(name: string, parent?: WebFlowPlace | undefined, factory?: WebFlowPresenterFactory, id?: number);
    toString(): string;
    private buildPath;
    private nextId;
}
