import { WebFlowApplication } from './WebFlowApplication'
import { WebFlowPlace } from './WebFlowPlace'
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
        // NOOP
    }

    public async applyParameters(place: WebFlowPlace, initialization: boolean, deepest: boolean): Promise<boolean> {
        return true
    }

    public commitComputedFields(): void {
        // NOOP
    }

    public publishParameters(place: WebFlowPlace): void {
        // NOOP
    }

}