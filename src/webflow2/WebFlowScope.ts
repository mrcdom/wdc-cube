import { NOOP_VOID } from './Constants'

export class WebFlowScope {

    public readonly id: string

    public update: () => void = NOOP_VOID

    public constructor(id: string) {
        this.id = id
    }
}