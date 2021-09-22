/* eslint-disable @typescript-eslint/no-unused-vars */

import { PlaceUri } from './PlaceUri'
import { Scope, ScopeType } from './Scope'

export type AlertSeverity = 'error' | 'success' | 'info' | 'warning'

export interface IDisposable {

    release(): void

}

export interface IPresenterOwner {

    unexpected(message: string, error: unknown): void

    alert(severity: AlertSeverity, title: string, message: string, onClose?: () => Promise<void>): void

}

export interface IPresenter extends IPresenterOwner, IDisposable {

    isAutoUpdateEnabled(): boolean

    isDirty(): boolean

    update(optionalScope?: Scope): void

    emitBeforeScopeUpdate(force?: boolean): void

    onBeforeScopeUpdate(): void

}

export interface ICubePresenter extends IPresenter {

    applyParameters(uri: PlaceUri, initialization: boolean, last?: boolean): Promise<boolean>

    publishParameters(uri: PlaceUri): void

}