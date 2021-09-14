import { Logger } from '../utils/Logger'
import { Scope } from './Scope'
import type { PresenterType } from './Presenter'
import type { IPresenter } from './IPresenter'

const LOG = Logger.get('ChangeMonitor')

type PresenterLike = IPresenter & {
    scope?: Scope
    update?(scope: Scope): void
    enableApply?(): void
}

type PrensenterHolder = {
    presenter: PresenterType
    debug: boolean
}

export class ChangeMonitor {

    public static readonly INSTANCE = new ChangeMonitor()

    private __initialized: boolean

    private __animationFrameHandler?: NodeJS.Timeout

    private __pendingMap: Map<PresenterType, PrensenterHolder>

    private constructor() {
        this.__initialized = false
        this.__pendingMap = new Map()
    }

    public get initialized(): boolean {
        return this.__initialized
    }

    public async postConstruct() {
        if (!this.__initialized) {
            this.__initialized = true
            LOG.debug('Initialized')
        }
    }

    public async preDestroy() {
        if (this.__initialized) {
            this.clearAnimationFrameHandler()
            this.__pendingMap.clear()
            LOG.debug('Finalized')
        }
    }

    public bind(presenter: IPresenter, debug = false): boolean {
        const presenterLike = presenter as PresenterLike
        if (presenterLike.scope && presenterLike.update && presenterLike.enableApply) {
            const realPresenter = presenter as PresenterType
            this.__pendingMap.set(realPresenter, { presenter: realPresenter, debug })

            realPresenter.enableApply()

            if (!this.__animationFrameHandler) {
                this.onAnimationFrame()
            }

            return true
        }
        return false
    }

    public unbind(presenter: IPresenter) {
        this.__pendingMap.delete(presenter as PresenterType)
        if (this.__pendingMap.size === 0) {
            this.clearAnimationFrameHandler()
        }
    }

    private clearAnimationFrameHandler() {
        if (this.__animationFrameHandler) {
            clearInterval(this.__animationFrameHandler)
            this.__animationFrameHandler = undefined
        }
    }

    private onAnimationFrame() {
        if (!this.initialized) {
            this.clearAnimationFrameHandler()
            return
        }

        try {
            for (const holder of this.__pendingMap.values()) {
                holder.presenter.apply(holder.debug)
            }
        } finally {
            this.__animationFrameHandler = setTimeout(this.onAnimationFrame.bind(this), 16)
        }
    }

}