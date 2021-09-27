/* eslint-disable @typescript-eslint/no-explicit-any */

import lodash from 'lodash'
import { IScope, NOOP_VOID } from 'wdc-cube'
import { types } from 'mobx-state-tree' // onSnapshot

export type PropertyType = 'string' | 'boolean' | 'number' | 'integer' | 'date' | 'map' | 'array'

const propertyTypeToMobXType: Record<PropertyType, [any, () => any]> = {
    'string': [types.string, () => ''],
    'boolean': [types.boolean, () => false],
    'number': [types.number, () => 0],
    'integer': [types.integer, () => 0],
    'date': [types.Date, () => undefined],
    'map': [types.map, () => new Object()],
    'array': [types.array, () => []]
}

export type ObserveConfig = {
    type?: PropertyType
}

type ObservePropertyDef = {
    key: string
    cfg?: ObserveConfig
}

const propertyDefByConstructorMap = new Map<new (...args: any[]) => any, ObservePropertyDef[]>()

interface IMobXScope extends IScope {
    $$mobx_model: Record<string, any>
}

export function observableScope<T extends new (...args: any[]) => IScope>(constructor: T) {
    const statics = createConstructorBodyAction(constructor)

    const constructorExt = class extends constructor implements IMobXScope {

        $$mobx_model: Record<string, any>

        constructor(...args: any[]) {
            super(...args)
            this.$$mobx_model = {}
            statics.init(this)
        }

        public override set forceUpdate(action: () => void) {
            super.forceUpdate = action
        }

        //public override observe(callback: () => void): () => void {
        //    return onSnapshot(this.$$mobx_model, callback)
        //}
    }

    Object.defineProperty(constructorExt, 'name', {
        value: constructor.name + 'MobX',
        configurable: true,
    })


    return constructorExt
}


export function observe(config?: ObserveConfig) {
    return (protoOrDescriptor: any, name?: PropertyKey): any => {
        const propertyKey = (name ?? protoOrDescriptor.key) as string
        let propertyDefArray = propertyDefByConstructorMap.get(protoOrDescriptor.constructor)
        if (!propertyDefArray) {
            propertyDefArray = []
            propertyDefByConstructorMap.set(protoOrDescriptor.constructor, propertyDefArray)
        }
        propertyDefArray.push({ key: propertyKey, cfg: config })
    }
}

function mobxSetAction(name: string, state: any, value: any) {
    state[name] = value
}

function createMobXStateClass(propertyKeyArray: ObservePropertyDef[], scope: any) {
    const modelDef = {} as Record<string, unknown>

    for (const { key, cfg } of propertyKeyArray) {
        const initValue = scope[key]

        let mobXType = initValue
        if (cfg && cfg.type) {
            const [informedType, defaultValue] = propertyTypeToMobXType[cfg.type]
            mobXType = types.optional(informedType as any, initValue ?? defaultValue())
        } else if (initValue !== undefined) {
            if (lodash.isBoolean(initValue)) {
                const [informedType, defaultValue] = propertyTypeToMobXType['boolean']
                mobXType = types.optional(informedType as any, initValue ?? defaultValue())
            } else if (lodash.isNumber(initValue)) {
                const [informedType, defaultValue] = propertyTypeToMobXType['number']
                mobXType = types.optional(informedType as any, initValue ?? defaultValue())
            } else if (lodash.isString(initValue)) {
                const [informedType, defaultValue] = propertyTypeToMobXType['string']
                mobXType = types.optional(informedType as any, initValue ?? defaultValue())
            } else if (lodash.isDate(initValue)) {
                const [informedType, defaultValue] = propertyTypeToMobXType['date']
                mobXType = types.optional(informedType as any, initValue ?? defaultValue())
            } else if (lodash.isArray(initValue)) {
                //mobXType = types.optional(types.array(initValue), [])
                mobXType = initValue
            } else if (lodash.isObject(initValue)) {
                //mobXType = types.optional(types.map(initValue), [])
                mobXType = initValue
            } else {
                mobXType = initValue
            }
        } else {
            mobXType = types.undefined
        }

        modelDef[key] = mobXType
    }

    const actionBuilder = (state: any) => {
        const actionDef = {} as Record<string, unknown>
        for (const { key } of propertyKeyArray) {
            const setMethodKey = 'set' + key.charAt(0).toUpperCase() + key.substring(1)
            actionDef[setMethodKey] = mobxSetAction.bind(undefined, key, state)
        }
        return actionDef
    }

    return types.model(modelDef as any).actions(actionBuilder as any)
}

function createConstructorBodyAction<T extends new (...args: any[]) => IScope>(constructor: T) {
    const statics = {
        init: NOOP_VOID as (scope: IMobXScope) => void
    }

    const propertyDefArray = propertyDefByConstructorMap.get(constructor)
    if (propertyDefArray) {
        propertyDefByConstructorMap.delete(constructor)

        for (const { key } of propertyDefArray) {
            bindProperty(constructor.prototype, key)
        }

        statics.init = (scope: IMobXScope) => {
            const modelClass = createMobXStateClass(propertyDefArray, scope)

            statics.init = (scope) => {
                // Remove instance property in order to avoid
                // misleading behaviour of getting defined attribute
                // instead of using the property
                for (const { key } of propertyDefArray) {
                    delete (scope as any)[key]
                }

                scope.$$mobx_model = modelClass.create()
            }

            statics.init(scope)
        }
    } else {
        statics.init = NOOP_VOID
    }
    return statics
}

function bindProperty(proto: any, key: string) {
    const setMethodKey = 'set' + key.charAt(0).toUpperCase() + key.substring(1)

    const descriptor: PropertyDescriptor = {

        get(this: IMobXScope) {
            return this.$$mobx_model[key]
        },

        set(this: IMobXScope, value: any) {
            this.$$mobx_model[setMethodKey](value)
        },

        enumerable: true,

        configurable: true,
    }

    Object.defineProperty(proto, key, descriptor)
}

