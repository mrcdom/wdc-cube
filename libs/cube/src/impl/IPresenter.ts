/**
 * Copyright © 2025 WeDoCode Consultoria e Soluções Avançadas LTDA. All rights reserved.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

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

/* eslint-disable @typescript-eslint/no-explicit-any */

export function mkAction<T extends (...args: any[]) => any>(me: IPresenter, fn: T): T {
    const fnName = `${me.constructor.name}.${fn.name}`

    const actionFn = function (...args: any[]) {
        try {
            const result = fn.call(me, ...args) as unknown

            // Acao assincrona: encadeia para que a rejeicao seja tratada aqui
            // e o chamador nao receba uma promise rejeitada sem handler
            if (isPromiseLike(result)) {
                return (result as Promise<unknown>)
                    .catch((caught) => actionOnCatch(me, fnName, caught))
                    .finally(() => actionOnFinally(me))
            }

            // Acao sincrona
            actionOnFinally(me)
            return result
        } catch (caught) {
            actionOnCatch(me, fnName, caught)
            actionOnFinally(me)
            return undefined
        }
    }

    return actionFn as unknown as T
}

export function isPromiseLike(value: unknown): value is Promise<unknown> {
    const candidate = value as Promise<unknown> | undefined
    return !!candidate && typeof candidate.then === 'function' && typeof candidate.finally === 'function'
}

export function actionOnCatch(me: IPresenter, name: string, caught: unknown) {
    me.unexpected(`During execution of ${name} action`, caught)
}

export function actionOnFinally(me: IPresenter) {
    const updateManager = me.updateManager
    if (updateManager.isAutoUpdateEnabled()) {
        me.updateIfNotDirty(me.scope)
        updateManager.emitBeforeScopeUpdate()
    }
    me.updateHistory()
}
