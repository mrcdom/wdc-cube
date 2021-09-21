import lodash from 'lodash'
import { Logger } from '../utils/Logger'
import { NOOP_PROMISE_VOID } from '../utils/EmptyFunctions'
import { Scope } from './Scope'

const LOG = Logger.get('ScopeUtils')


// :: Internal Types

type FunctionLike = {
    bind(instance: unknown): void
}

// :: Private static functions

function isAnActionName(s: string) {
    // Made with efficience in mind
    if (s && s.length > 3) {
        const c = s.charAt(2)
        return s.charAt(0) === 'o' && s.charAt(1) == 'n' && c.toUpperCase() === c
    }
    return false
}

export const ScopeUtils = {

    isAnActionName: isAnActionName,

    bind(scope: Scope, source: unknown) {
        const target = (scope as unknown) as Record<string, unknown>
        for (const name of Object.keys(target)) {
            if (isAnActionName(name)) {
                const possibleAction = (source as Record<string, unknown>)[name]
                if (lodash.isFunction(possibleAction)) {
                    target[name] = (possibleAction as FunctionLike).bind(source)
                } else {
                    target[name] = NOOP_PROMISE_VOID
                    LOG.warn(`{${scope.constructor.name}} No action found under the name of "${name}"`)
                }
            }
        }
    }
}