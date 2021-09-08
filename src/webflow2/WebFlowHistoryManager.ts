/* eslint-disable @typescript-eslint/no-unused-vars */

export class WebFlowHistoryManager {

    public static NOOP = new WebFlowHistoryManager()

    public update(tokenProvider: () => string): void {
        // NOOP
    }

}