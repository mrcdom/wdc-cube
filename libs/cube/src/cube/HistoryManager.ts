import { NOOP_STRING } from './Constants'

/* eslint-disable @typescript-eslint/no-unused-vars */

const NOPP_ONCHANGE_LISTENER = (sender: HistoryManager) => {
    // NOOP
}

export class HistoryManager {

    public static NOOP = new HistoryManager()

    public onChangeListener = NOPP_ONCHANGE_LISTENER

    private __tokenProvider = NOOP_STRING

    public get tokenProvider() {
        return this.__tokenProvider
    }

    public set tokenProvider(provider: () => string) {
        this.__tokenProvider = provider
    }

    public get location() {
        return ''
    }

    public update(): void {
        // NOOP
    }

}