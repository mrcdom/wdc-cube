/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

/**
 * The handful of type checks this framework needs, spelled out rather than
 * pulled from lodash.
 *
 * They were deep CommonJS imports (`lodash/isString` and friends), which a
 * bundler cannot treat as ES modules — Angular's build warns about the
 * optimisation bailout, and its dev server cannot resolve them at all from a
 * linked workspace package. Eleven call sites did not justify the dependency.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isFunction(value: unknown): value is (...args: any[]) => any {
    return typeof value === 'function'
}

/** Matches lodash's isObject: functions and arrays count, `null` does not. */
export function isObject(value: unknown): value is object {
    const type = typeof value
    return value !== null && (type === 'object' || type === 'function')
}

export function isString(value: unknown): value is string {
    return typeof value === 'string'
}

export function isNumber(value: unknown): value is number {
    return typeof value === 'number'
}

export function isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean'
}
