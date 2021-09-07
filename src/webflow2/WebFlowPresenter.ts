import { NOOP_VOID } from './Constants'
import { WebFlowApplication } from './WebFlowApplication'
import { WebFlowURI } from './WebFlowURI'
import type { WebFlowScope } from './WebFlowScope'

/* eslint-disable @typescript-eslint/no-unused-vars */

export class WebFlowPresenter<Application extends WebFlowApplication, Scope extends WebFlowScope> {

    protected readonly app: Application

    public readonly scope: Scope

    public constructor(app: Application, scope: Scope) {
        this.app = app
        this.scope = scope
    }

    public release(): void {
        this.scope.update = NOOP_VOID
    }

    public async applyParameters(uri: WebFlowURI, initialization: boolean, deepest: boolean): Promise<boolean> {
        return true
    }

    public commitComputedFields(): void {
        // NOOP
    }

    public publishParameters(uri: WebFlowURI): void {
        // NOOP
    }

}