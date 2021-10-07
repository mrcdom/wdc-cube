/* eslint-disable @typescript-eslint/no-unused-vars */

import { Place } from './Place'
import { FlipIntent, ValidParamTypes } from './FlipIntent'
import { Scope, ScopeConstructor } from './Scope'

export type AlertSeverity = 'error' | 'success' | 'info' | 'warning'

export interface IDisposable {

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

    unexpected(message: string, error: unknown): void

    alert(severity: AlertSeverity, title: string, message: string, onClose?: () => Promise<void>): void

}

export interface IPresenter extends IPresenterOwner, IDisposable {

    get scope(): Scope

    get updateManager(): IUpdateManager

    update(optionalScope?: Scope): void

    updateIfNotDirty(scope: Scope): void

    onBeforeScopeUpdate(): void

}

export interface ICubePresenter extends IPresenter {

    applyParameters(intent: FlipIntent, initialization: boolean, last?: boolean): Promise<boolean>

    publishParameters?(intent: FlipIntent): void

    updateHistory(): void

    flip(place: Place, args?: { params?: Record<string, ValidParamTypes>; attrs?: Record<string, unknown> }): Promise<void>

    flipToIntent(intent: FlipIntent): Promise<void>

    flipToIntentString(sIntent: string): Promise<void>

}
