/* eslint-disable @typescript-eslint/no-unused-vars */

import { Place } from './Place'
import { Application } from './Application'

const NOOP_ONCHANGE_LISTENER = (sender: HistoryManager) => {
    // NOOP
}

export class HistoryManager {

    public static NOOP = new HistoryManager()

    public onChangeListener = NOOP_ONCHANGE_LISTENER

    public get location() {
        return ''
    }

    public update(app: Application, place: Place): void {
        // NOOP
    }

}