/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import { Logger } from './utils/Logger.js'
import { NOOP_VOID } from './utils/EmptyFunctions.js'
import { Place } from './Place.js'
import { FlipIntent } from './FlipIntent.js'
import { HistoryManager } from './HistoryManager.js'
import { Application } from './Application.js'
import { FlipContext } from './FlipContext.js'
import { Scope } from './Scope.js'
import { ScopeUpdateManager } from './Presenter.js'

import { type IUpdateManager, type ICubePresenter, type IPresenter, mkAction } from './IPresenter.js'

const LOG = Logger.get('ApplicationPresenter')

export class ApplicationPresenter<S extends Scope> extends Application implements ICubePresenter {
    private __scope: S

    private readonly __scopeUpdateManager: IUpdateManager

    private readonly __beforeScopeUpdateListener: () => void

    private __updateCount = 0

    public constructor(historyManager: HistoryManager, scope: S) {
        super(Place.ROOT, historyManager)

        this.__scope = scope

        this.__beforeScopeUpdateListener = () => {
            try {
                this.onBeforeScopeUpdate()
            } finally {
                this.__updateCount = 0
            }
        }

        this.__scopeUpdateManager = new ScopeUpdateManager(scope)
        this.__scopeUpdateManager.addOnBeforeScopeUpdateListener(this.__beforeScopeUpdateListener)

        this.__scopeUpdateManager.update(scope)

        this.__scope.update = this.update
    }

    public override release() {
        this.__scope.update = NOOP_VOID
        this.__scope.forceUpdate = NOOP_VOID
        this.__scopeUpdateManager.removeOnBeforeScopeUpdateListener(this.__beforeScopeUpdateListener)
        this.__scopeUpdateManager.release()
        super.release()
    }

    // :: Properties

    public get scope(): S {
        return this.__scope
    }

    public get updateManager(): IUpdateManager {
        return this.__scopeUpdateManager
    }

    // :: Application Extensions

    protected override publishAllParameters(intent: FlipIntent) {
        this.publishParameters(intent)
        super.publishAllParameters(intent)
    }

    protected override async applyPathParameters(context: FlipContext, atLevel: number) {
        const intent = context.targetIntent
        const last = intent.place.id === -1
        const ok = (await this.applyParameters(intent, false, last)) && !last
        if (!ok) {
            return
        }

        await super.applyPathParameters(context, atLevel)
    }

    // :: IPresenter Api

    public readonly update = this.doUpdate.bind(this)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public action<P extends IPresenter, T extends (...args: any[]) => any>(fn: T, owner: P | null = null): T {
        return mkAction(this, (owner ? fn.bind(owner) : fn.bind(this)) as T)
    }

    protected doUpdate(optionalScope?: Scope) {
        this.__scopeUpdateManager.update(optionalScope ?? this.scope)
        this.__updateCount++
    }

    public updateIfNotDirty(scope: Scope): void {
        if (this.__updateCount === 0) {
            this.doUpdate(scope)
        }
    }

    public onBeforeScopeUpdate(): void {
        // NOOP
    }

    // :: ICubePresenter Api

    public async kickStart(safePlace: Place) {
        let intent = this.newIntentFromString(this.historyManager.location)
        try {
            await this.applyParameters(intent.redirect(this.rootPlace), true, true)

            if (intent.place !== this.rootPlace) {
                intent.attributes.clear()
                await this.flipToIntent(intent)
            }
        } catch {
            // Redirect to a safe place
            intent = intent.redirect(safePlace)
            intent.attributes.clear()
            await this.flipToIntent(intent)
        }
    }

    public async applyParameters(intent: FlipIntent, initialization: boolean, last: boolean): Promise<boolean> {
        LOG.debug(`applyParameters(intent=${intent}, initialization=${initialization}, last=${last}`)
        return true
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public publishParameters(intent: FlipIntent): void {
        // NOOP
    }
}
