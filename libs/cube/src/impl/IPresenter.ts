/**
 * Copyright © 2025 WeDoCode Consultoria e Soluções Avançadas LTDA. All rights reserved.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import { Place } from './Place'
import { FlipIntent, ValidParamTypes } from './FlipIntent'
import { Scope, ScopeConstructor } from './Scope'

export type AlertSeverity = 'error' | 'success' | 'info' | 'warning'

export interface IDisposable {
    get isReleasing(): boolean

    get isReleased(): boolean

    release(): void
}

export interface IUpdateManager extends IDisposable {
    get scope(): Scope

    isAutoUpdateEnabled(): boolean
    disableAutoUpdate(): void
    emitBeforeScopeUpdate(): void

    hint(scopeCtor: ScopeConstructor, scope: Scope, maxUpdate: number): void
    update(optionalScope?: Scope): void

    addOnBeforeScopeUpdateListener(listener: () => void): void
    removeOnBeforeScopeUpdateListener(listener: () => void): void
}

export interface IPresenterOwner {
    updateHistory(): void
    unexpected(message: string, error: unknown): void

    alert(severity: AlertSeverity, title: string, message: string, onClose?: () => Promise<void>): void
}

export interface IPresenter extends IPresenterOwner, IDisposable {
    get scope(): Scope

    get updateManager(): IUpdateManager

    updateHistory(): void

    update(optionalScope?: Scope): void

    updateIfNotDirty(scope: Scope): void

    onBeforeScopeUpdate(): void
}

export interface ICubePresenter extends IPresenter {
    applyParameters(intent: FlipIntent, initialization: boolean, last?: boolean): Promise<boolean>

    publishParameters?(intent: FlipIntent): void

    updateHistory(): void

    flip(
        place: Place,
        args?: { params?: Record<string, ValidParamTypes>; attrs?: Record<string, unknown> }
    ): Promise<void>

    flipToIntent(intent: FlipIntent): Promise<void>

    flipToIntentString(sIntent: string): Promise<void>
}

export function mkAction<T extends (...args: any[]) => any>(me: IPresenter, fn: T): T {
    const fnName = `${me.constructor.name}.${fn.name}`

    const actionFn: T = (function (...args: any[]) {
        let isNonPromise = true
        try {
            const result = fn.call(me, ...args)

            if (result && (result as Promise<void>).catch && (result as Promise<unknown>).finally) {
                isNonPromise = false
                const resultPromise = result as Promise<void>
                resultPromise.catch(e => action_onCatch(me, fnName, e))
                resultPromise.finally(() => action_onFinally(me))
            }

            return result
        } catch (e) {
            isNonPromise && action_onCatch(me, fnName, e)
        } finally {
            isNonPromise && action_onFinally(me)
        }
    } as unknown) as T

    return actionFn
}

// :: internal

function action_onCatch(me: IPresenter, name: string, caught: unknown) {
    me.unexpected(`During execution of ${name} action`, caught)
}

function action_onFinally(me: IPresenter) {
    const updateManager = me.updateManager
    if (updateManager.isAutoUpdateEnabled()) {
        me.updateIfNotDirty(me.scope)
        updateManager.emitBeforeScopeUpdate()
    }
    me.updateHistory()
}
