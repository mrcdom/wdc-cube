/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import { isBoolean, isNumber, isString } from './TypeGuards.js'

export type PossibleParameterTypes = NumberConstructor | StringConstructor | BooleanConstructor

type ClassConstructor = new (...args: unknown[]) => unknown

export type InstanceLike = {
    constructor: ClassConstructor
    prototype: Record<string, unknown>
}

type NameLike = {
    name?: string
}

async function asyncFunction() {
    // NOOP
}

export const AsyncFunction = asyncFunction.constructor as { new (): Promise<unknown> }

export class ReflectionUtils {
    public static isInstanceOf(instance: unknown, ctor: ClassConstructor): boolean {
        if (instance === undefined || instance === null) {
            return false
        }

        return (instance as InstanceLike).constructor === ctor
    }

    public static getName(value: unknown) {
        if (value) {
            const name = (value as NameLike).name
            if (name) {
                return name
            }

            const ctor = (value as InstanceLike).constructor
            if (ctor) {
                return ctor.name
            }
        }
        return undefined
    }

    public static isArray(value: unknown): boolean {
        return Array.isArray(value)
    }

    public static isFunction(value: unknown): boolean {
        if (value) {
            const ctor = (value as InstanceLike).constructor
            return ctor === Function || ctor === AsyncFunction
        }
        return false
    }

    public static isSyncFunction(value: unknown): boolean {
        if (value) {
            return (value as InstanceLike).constructor === Function
        }
        return false
    }

    public static isAsyncFunction(value: unknown): boolean {
        if (value) {
            return (value as InstanceLike).constructor === AsyncFunction
        }
        return false
    }

    public static getType(item: unknown): PossibleParameterTypes | undefined {
        if (item !== undefined && item !== null) {
            if (isString(item)) {
                return String
            }

            if (isNumber(item)) {
                return Number
            }

            if (isBoolean(item)) {
                return Boolean
            }
        }
        return undefined
    }

    public static getArrayType(array: Array<unknown>): PossibleParameterTypes | undefined {
        if (array && array.length > 0) {
            for (const item of array) {
                if (item) {
                    return ReflectionUtils.getType(item)
                }
            }
        }
        return undefined
    }

    public static toUnknown(value: unknown, clazz?: PossibleParameterTypes): unknown {
        if (value === undefined && value === null) {
            return undefined
        }

        if (!clazz) {
            return value
        }

        if (isNumber(value)) {
            if (clazz === Number) {
                return value
            }

            if (clazz === String) {
                return String(value)
            }

            if (clazz === Boolean) {
                return value !== 0
            }

            return value
        }

        if (isString(value)) {
            if (clazz === String) {
                return value
            }

            const s = value as string

            if (clazz === Number) {
                return s.includes('.') ? Number.parseFloat(s) : Number.parseInt(s)
            }

            if (clazz === Boolean) {
                return 'true' === s
            }

            return s
        }

        if (isBoolean(value)) {
            if (clazz === Boolean) {
                return value
            }

            const b = value as boolean

            if (clazz === Number) {
                return b ? 1 : 0
            }

            if (clazz === String) {
                return b ? 'true' : 'false'
            }

            return b
        }

        return value
    }

    public static toString(value: unknown, defaultValue?: string): string | undefined {
        if (value !== null && value !== undefined) {
            const v = ReflectionUtils.toUnknown(value, String) as string
            return v === null || v === undefined ? defaultValue : v
        }
        return defaultValue
    }

    public static toNumber(value: unknown, defaultValue?: number): number | undefined {
        if (value !== null && value !== undefined) {
            const v = ReflectionUtils.toUnknown(value, Number) as number
            return v === null || v === undefined ? defaultValue : v
        }
        return defaultValue
    }

    public static toBoolean(value: unknown, defaultValue?: boolean): boolean | undefined {
        if (value) {
            const v = ReflectionUtils.toUnknown(value, Boolean) as boolean
            return v === null || v === undefined ? defaultValue : v
        }
        return defaultValue
    }
}
