/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import { Logger } from './utils/Logger.js'

const LOG = Logger.get('ChangeMonitor')

export class CallbackManager {
    private static readonly INSTANCE = new CallbackManager()

    public static singleton() {
        return CallbackManager.INSTANCE
    }

    private __animationFrameHandler?: number

    private __callbackMap: Map<() => void, boolean>

    private __onceCallbackMap: Map<() => void, boolean>

    private __errorCount = 0

    private constructor() {
        this.__callbackMap = new Map()
        this.__onceCallbackMap = new Map()
    }

    public bind(callback: () => void) {
        this.__callbackMap.set(callback, true)
        if (!this.__animationFrameHandler) {
            this.launchAnimationFrame()
        }
    }

    public bindOnce(callback: () => void) {
        this.__onceCallbackMap.set(callback, true)
        this.launchAnimationFrame()
    }

    public unbind(callback: () => void) {
        this.__callbackMap.delete(callback)
        this.__onceCallbackMap.delete(callback)

        if (this.__callbackMap.size === 0 && this.__onceCallbackMap.size === 0) {
            this.clearAnimationFrame()
        }
    }

    private launchAnimationFrame() {
        if (!this.__animationFrameHandler && (this.__callbackMap.size > 0 || this.__onceCallbackMap.size > 0)) {
            this.__animationFrameHandler = setTimeout(this.onFlush.bind(this), 16)
        }
    }

    /**
     * True while callbacks are waiting for the next frame. Only once-callbacks
     * count: those bound with `bind` are permanent and never drain.
     */
    public get hasPendingCallbacks(): boolean {
        return this.__onceCallbackMap.size > 0
    }

    /**
     * Runs what is pending now, instead of on the next frame. Updates are
     * batched on a timer, which a test cannot wait on without guessing; this
     * gives it a way to settle the queue deliberately.
     */
    public flush(): void {
        this.clearAnimationFrame()
        this.onFlush()
    }

    private clearAnimationFrame() {
        if (this.__animationFrameHandler) {
            // clearTimeout, not clearInterval: the handle comes from setTimeout.
            // The two share an id space, so the old call worked, but only by
            // accident.
            clearTimeout(this.__animationFrameHandler)
            this.__animationFrameHandler = undefined
        }
    }

    private onFlush() {
        try {
            for (const callback of this.__callbackMap.keys()) {
                try {
                    callback()
                } catch (caught) {
                    if (this.__errorCount < 100) {
                        LOG.error('Updating frame - calling regular callback', caught)
                        this.__errorCount++
                    }
                }
            }

            for (const callback of this.__onceCallbackMap.keys()) {
                try {
                    callback()
                } catch (caught) {
                    if (this.__errorCount < 100) {
                        LOG.error('Updating frame - calling once callback', caught)
                        this.__errorCount++
                    }
                }
            }
        } finally {
            this.__onceCallbackMap.clear()
            this.__animationFrameHandler = undefined
            this.launchAnimationFrame()
        }
    }
}
