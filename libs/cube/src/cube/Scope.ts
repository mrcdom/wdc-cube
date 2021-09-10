import { Logger } from '../utils/Logger'
import { NOOP_VOID, NOOP_PROMISE_VOID } from './Constants'
import { CastUtils } from '../utils/CastUtils'

const LOG = Logger.get('Scope')

export type Action = (...args: unknown[]) => Promise<void>

function isAnActionName(s: string) {
    // Made with efficience in mind
    if (s && s.length > 3) {
        const c = s.charAt(2)
        return s.charAt(0) === 'o' && s.charAt(1) == 'n' && c.toUpperCase() === c
    }
    return false
}

type FunctionLike = {
    bind(instance: unknown): void
}

export const ScopeUtils = {

    bind(scope: Scope, source: unknown) {
        const target = (scope as unknown) as Record<string, unknown>
        for (const name of Object.keys(target)) {
            if (isAnActionName(name)) {
                const possibleAction = (source as Record<string, unknown>)[name]
                if (CastUtils.isFunction(possibleAction)) {
                    target[name] = (possibleAction as FunctionLike).bind(source)
                } else {
                    target[name] = NOOP_PROMISE_VOID
                    LOG.warn(`{${scope.constructor.name}} No action found under the name of "${name}"`)
                }
            }
        }
    }

}

export class Scope {

    public readonly id: string

    public update: () => void = NOOP_VOID

    public constructor(id: string) {
        this.id = id
    }

    public bind(source: unknown) {
        ScopeUtils.bind(this, source)
    }

}