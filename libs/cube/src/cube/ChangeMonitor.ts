import { Logger } from '../utils/Logger'
import { Scope } from './Scope'
import { ScopeUtils } from './ScopeUtils'
import type { PresenterType } from './Presenter'
import type { IPresenter } from './IPresenter'

const LOG = Logger.get('ChangeMonitor')

type PresenterLike = IPresenter & {
    scope?: Scope
    update?(scope: Scope): void
}

type PrensenterHolder = {
    presenter: PresenterType
    state: Map<string, Record<string, unknown>>
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

    public bind(presenter: IPresenter, debug: boolean = false): boolean {
        const presenterLike = presenter as PresenterLike
        if (presenterLike.scope && presenterLike.update) {
            this.__pendingMap.set(presenterLike as PresenterType, {
                presenter: presenterLike as PresenterType,
                state: ScopeUtils.exportState(presenterLike.scope),
                debug
            })

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
                const scope = holder.presenter.scope

                const oldState = holder.state
                const dirtyScopes = ScopeUtils.exportDirties(scope, oldState)
                holder.state = ScopeUtils.exportState(scope)
                if (dirtyScopes.size > 0) {
                    if (holder.debug) {
                        LOG.debug('SCOPE Dirties:', JSON.stringify(Object.keys(Object.fromEntries(dirtyScopes)), null, '  '))
                    }

                    for (const dirtyScope of dirtyScopes.values()) {
                        holder.presenter.update(dirtyScope)
                    }
                }
            }
        } finally {
            this.__animationFrameHandler = setTimeout(this.onAnimationFrame.bind(this), 16)
        }
    }

}