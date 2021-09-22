/* eslint-disable @typescript-eslint/no-unused-vars */

import { Place } from './Place'
import { Application } from './Application'


export type HistoryChangeListener = (sender: HistoryManager) => void

export class HistoryManager {

    public static NOOP = new HistoryManager()

    private __changeListenerMap = new Map<number, HistoryChangeListener>()

    private __listenerIdGen = 0

    public get location() {
        return ''
    }

    public update(app: Application, place: Place): void {
        // NOOP
    }

    public addChangeListener(listener: HistoryChangeListener) {
        const listenerId = this.__listenerIdGen++
        this.__changeListenerMap.set(listenerId, listener)
        return () => {
            this.__changeListenerMap.delete(listenerId)
        }
    }

    public notifyChanges() {
        if (this.__changeListenerMap.size > 0) {
            for (const listener of this.__changeListenerMap.values()) {
                listener(this)
            }
        }
    }
}