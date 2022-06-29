import { Logger } from '../utils/Logger'

const LOG = Logger.get('ChangeMonitor')

export class CallbackManager {
    private static readonly INSTANCE = new CallbackManager()

    public static singleton() {
        return CallbackManager.INSTANCE
    }

    private __animationFrameHandler?: NodeJS.Timeout

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

    private clearAnimationFrame() {
        if (this.__animationFrameHandler) {
            clearInterval(this.__animationFrameHandler)
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
