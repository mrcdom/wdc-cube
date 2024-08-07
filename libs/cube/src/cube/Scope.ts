import { Logger } from '../utils/Logger'
import { NOOP_VOID } from '../utils/EmptyFunctions'
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
}
