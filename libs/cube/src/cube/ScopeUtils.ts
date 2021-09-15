import lodash from 'lodash'
import { Logger } from '../utils/Logger'
import { NOOP_PROMISE_VOID } from './Constants'
import { Scope } from './Scope'

const LOG = Logger.get('ScopeUtils')


// :: Internal Types

type ScopeHolder = {
    parentPath: string
    scope: Scope
}

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

function copyOrCloneValue(value: unknown, level: number) {
    if (value === undefined || value === null) {
        return value
    }

    if (lodash.isNumber(value)) {
        return value
    }

    if (lodash.isString(value)) {
        return value
    }

    if (lodash.isBoolean(value)) {
        return value
    }

    if (lodash.isDate(value)) {
        return value
    }

    if (lodash.isFunction(value)) {
        return value
    }

    if (level > 20) {
        LOG.warn('Too deep export')
        return
    }

    if (lodash.isArray(value)) {
        const nextLevel = level + 1
        const valueAsArray = value as unknown[]
        if (valueAsArray.length > 0) {
            const otherValue = [] as unknown[]
            if (otherValue[0] instanceof Scope) {
                return otherValue.length
            }
            for (const valueItem of valueAsArray) {
                otherValue.push(copyOrCloneValue(valueItem, nextLevel))
            }
            return otherValue
        } else {
            return []
        }
    }

    if (lodash.isObject(value)) {
        if (value instanceof Scope) {
            return value.vid
        } else {
            const otherValue = {} as Record<string, unknown>
            exportState(otherValue, value as Record<string, unknown>, level + 1)
            return otherValue
        }
    }
}

function exportState(target: Record<string, unknown>, source: unknown, level: number) {
    if (level > 20) {
        LOG.warn('Too deep export')
        return
    }

    if (lodash.isObject(source)) {
        const nextLevel = level + 1
        for (const [key, value] of Object.entries(source)) {
            if (!isAnActionName(key) && !lodash.isFunction(value)) {
                target[key] = copyOrCloneValue(value, nextLevel)
            }
        }
    }
}


function exportScopes(scopeArray: Map<string, ScopeHolder>, source: unknown, path: string, parentPath: string) {
    if (source == undefined || source === null) {
        return
    }

    if (lodash.isObject(source)) {
        let newParentPath = parentPath
        if (source instanceof Scope) {
            scopeArray.set(path, { parentPath, scope: source })
            newParentPath = path
        }

        for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
            exportScopes(scopeArray, value, path + '/' + key, newParentPath)
        }
        return
    }

    if (lodash.isArray(source)) {
        const sourceArray = source as unknown[]
        for (let i = 0; i < sourceArray.length; i++) {
            exportScopes(scopeArray, sourceArray[i], path + '/' + i, parentPath)
        }
        return
    }
}

function isArrayEquals(a: unknown[], b: unknown[], maxLevel: number): boolean {
    if (a.length !== b.length) {
        return false
    }

    for (let i = 0; i < a.length; i++) {
        if (!isEquals(a[i], b[i], maxLevel)) {
            return false
        }
    }

    return true
}

function isEquals(thisValue: unknown, otherValue: unknown, maxLevel: number): boolean {
    if (thisValue === otherValue) {
        return true
    }

    if (thisValue === undefined || thisValue === null) {
        return false
    }

    if (otherValue === undefined || otherValue === null) {
        return false
    }

    if (maxLevel <= 0) {
        LOG.warn('Too many levels to compare scopes')
        return false
    }

    if (thisValue instanceof Scope) {
        return false
    }

    if (lodash.isArray(thisValue)) {
        if (!lodash.isArray(otherValue)) {
            return false
        }

        if (!isArrayEquals(thisValue as unknown[], otherValue as unknown[], maxLevel)) {
            return false
        }
    }

    const thisProps = new Map<string, unknown>()
    for (const [key, value] of Object.entries(thisValue as Record<string, unknown>)) {
        if (!ScopeUtils.isAnActionName(key) && !lodash.isFunction(value)) {
            thisProps.set(key, value)
        }
    }

    const otherProps = new Map<string, unknown>()
    for (const [key, value] of Object.entries(otherValue as Record<string, unknown>)) {
        if (!ScopeUtils.isAnActionName(key) && !lodash.isFunction(value)) {
            otherProps.set(key, value)
        }
    }

    if (thisProps.size !== otherProps.size) {
        return false
    }

    if (thisProps.size === 0) {
        return true
    }

    const previousLevel = maxLevel - 1
    for (const [key, thisValue] of thisProps.entries()) {
        const otherValue = otherProps.get(key)

        if (!isEquals(thisValue, otherValue, previousLevel)) {
            return false
        }

        otherProps.delete(key)
    }

    if (otherProps.size !== 0) {
        return false
    }

    return true
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
    },

    exportState(thisScope: Scope, map?: Map<string, Record<string, unknown>>) {
        map = map ?? new Map()

        const currentScopeMap = new Map<string, ScopeHolder>()
        exportScopes(currentScopeMap, thisScope, '$', '')

        for (const [path, holder] of currentScopeMap.entries()) {
            const entry = {} as Record<string, unknown>
            exportState(entry, holder.scope, 0)
            map.set(path, entry)
        }

        return map
    },

    exportDirties(thisScope: Scope, previousState: Map<string, Record<string, unknown>>, map?: Map<string, Scope>): Map<string, Scope> {
        map = map ?? new Map()

        const currentScopeMap = new Map<string, ScopeHolder>()
        exportScopes(currentScopeMap, thisScope, '$', '')

        for (const [path, holder] of currentScopeMap.entries()) {
            const previousEntry = previousState.get(path)
            if (previousEntry) {
                const currentEntry = {} as Record<string, unknown>
                exportState(currentEntry, holder.scope, 0)
                if (!lodash.isEqual(currentEntry, previousEntry)) {
                    map.set(path, holder.scope)
                }
            } else {
                const parentScopeHolder = currentScopeMap.get(holder.parentPath)
                if (parentScopeHolder) {
                    map.set(holder.parentPath, parentScopeHolder.scope)
                }
                map.set(path, holder.scope)
            }
        }

        return map
    },

    isEquals(thisValue: unknown, otherValue: unknown): boolean {
        return isEquals(thisValue, otherValue, 5)
    }

}