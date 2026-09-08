/**
 * Copyright © 2025 WeDoCode Consultoria e Soluções Avançadas LTDA. All rights reserved.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import { Logger } from './utils/Logger'
import { NOOP_VOID } from './utils/EmptyFunctions'
import { ScopeUpdateManager } from './Presenter'

const LOG = Logger.get('Scope')

function syncAction(...args: unknown[]): void {
    LOG.debug('Noop Synchronous Action', args)
}

async function asyncAction(...args: unknown[]): Promise<void> {
    LOG.debug('Noop Asynchronous Action', args)
}

export type ScopeConstructor = new () => Scope

export interface IScope {
    forceUpdate: () => void
    identity?: unknown
    update: (scope?: Scope) => void
}

export abstract class Scope implements IScope {
    // Class

    public static property<T>(me: Scope, v: T) {
        let currentVal = v
        return ((...args: unknown[]) => {
            if (args.length > 0) {
                const newVal: T = args[0] as T
                if (newVal !== currentVal) {
                    const oldVal = currentVal
                    currentVal = newVal
                    me.update()
                    return oldVal
                }
            }
            return currentVal
        }) as (v?: T) => T
    }

    public static readonly SYNC_ACTION = syncAction
    public static readonly SYNC_ACTION_BOOLEAN: (p: boolean) => void = syncAction
    public static readonly SYNC_ACTION_NUMBER: (p: number) => void = syncAction
    public static readonly SYNC_ACTION_STRING: (p: string) => void = syncAction
    public static readonly SYNC_ACTION_DATE: (p: Date) => void = syncAction

    public static SYNC_ACTION_ONE<P>(): (p0: P) => void {
        return syncAction
    }

    public static SYNC_ACTION_TWO<P0, P1>(): (p0: P0, p1: P1) => void {
        return syncAction
    }

    public static SYNC_ACTION_THREE<P0, P1, P2>(): (p0: P0, p1: P1, p2: P2) => void {
        return syncAction
    }

    public static readonly ASYNC_ACTION = asyncAction
    public static readonly ASYNC_ACTION_BOOLEAN: (p: boolean) => Promise<void> = asyncAction
    public static readonly ASYNC_ACTION_NUMBER: (p: number) => Promise<void> = asyncAction
    public static readonly ASYNC_ACTION_STRING: (p: string) => Promise<void> = asyncAction
    public static readonly ASYNC_ACTION_DATE: (p: Date) => Promise<void> = asyncAction

    public static ASYNC_ACTION_ONE<P>(): (p0: P) => Promise<void> {
        return asyncAction
    }

    public static ASYNC_ACTION_TWO<P0, P1>(): (p0: P0, p1: P1) => Promise<void> {
        return asyncAction
    }

    public static ASYNC_ACTION_THREE<P0, P1, P2>(): (p0: P0, p1: P1, p2: P2) => Promise<void> {
        return asyncAction
    }

    // API

    public updateAsRoot() {
        return (this.update = ScopeUpdateManager.newUpdateRoot(this))
    }

    public forceUpdate: () => void = NOOP_VOID

    public update: (scope?: Scope) => void = NOOP_VOID

    /**
     * What this scope is, for a view that draws a list of them.
     *
     * Deliberately not observed: an identity does not change, so assigning it
     * must not mark the scope dirty.
     *
     * A view reconciling a list has to decide which row already stood for which
     * item, and only the presenter knows the answer — whether the instance is
     * stable, or whether the same thing may arrive as a new object. Left to the
     * views, that judgement is made once per view and drifts: this repository
     * had React keying on `todo.id`, Angular tracking `todo.id`, and a third
     * binding keying on the instance.
     *
     * Set it to whatever identifies the data, and leave it alone otherwise; a
     * scope that never appears in a list never needs one.
     */
    public identity?: unknown
}
