export class WebFlowStep {

    public static UNKNOWN = new WebFlowStep(-1, 'unknown')

    public constructor(
        public readonly id: number,
        public readonly name: string
    ) {
        // NOOP
    }

}