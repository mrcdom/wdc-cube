import { Logger } from '../utils/Logger'
import { NOOP_VOID } from './Constants'

const LOG = Logger.get('Scope')

async function actionWithNoArgs(...args:unknown[]) {
    LOG.debug('Noop Action', args)
}

export type ScopeType = typeof Scope

export abstract class Scope {

    // Class

    public static readonly ACTION = actionWithNoArgs
    public static readonly ACTION_BOOLEAN: (p: boolean) => Promise<void> = actionWithNoArgs
    public static readonly ACTION_NUMBER: (p: number) => Promise<void> = actionWithNoArgs
    public static readonly ACTION_STRING: (p: string) => Promise<void> = actionWithNoArgs
    public static readonly ACTION_DATE: (p: Date) => Promise<void> = actionWithNoArgs

    public static ACTION_ONE<P>(): (p0: P) => Promise<void> {
        return actionWithNoArgs
    }

    public static ACTION_TWO<P0, P1>(): (p0: P0, p1: P1) => Promise<void> {
        return actionWithNoArgs
    }

    public static ACTION_THREE<P0, P1, P2>(): (p0: P0, p1: P1, p2: P2) => Promise<void> {
        return actionWithNoArgs
    }

    // API

    public update: () => void = NOOP_VOID

}