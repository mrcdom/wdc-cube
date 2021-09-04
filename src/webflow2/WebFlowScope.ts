const NOOP_FN = () => {
    // NOOP
}

export class WebFlowScope {

    public readonly id: string

    public update: () => void = NOOP_FN

    public constructor(id: string) {
        this.id = id
    }
}