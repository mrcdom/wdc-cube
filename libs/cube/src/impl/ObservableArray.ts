/**
 * Copyright © 2025 WeDoCode Consultoria e Soluções Avançadas LTDA. All rights reserved.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import { Scope } from './Scope'

export class ObservableArray<T> implements Iterable<T> {
    #scope: Scope
    #items: Array<T>

    constructor(scope: Scope, items?: T[]) {
        this.#scope = scope
        this.#items = items ?? []
    }

    #update() {
        this.#scope.update(this.#scope)
    }

    [Symbol.iterator]() {
        return this.#items[Symbol.iterator]()
    }

    keys() {
        return this.#items.keys()
    }

    values() {
        return this.#items.values()
    }

    get length() {
        return this.#items.length
    }

    set length(value: number) {
        if (this.#items.length !== value) {
            this.#items.length = value
            this.#update()
        }
    }

    at(index: number) {
        return this.#items.at(index)
    }

    get(idx: number) {
        return this.#items[idx]
    }

    set(idx: number, value: T) {
        const old = this.#items[idx]
        if (old !== value) {
            this.#items[idx] = value
            this.#update()
        }
    }

    push(value: T) {
        this.#items.push(value)
        this.#update()
    }

    assign(array: T[]) {
        let changed = false

        if (this.#items.length !== array.length) {
            this.#items.length = array.length
            changed = true
        }

        for (let i = 0; i < array.length; i++) {
            const old = this.#items[i]
            const value = array[i]
            if (old !== value) {
                this.#items[i] = value
                changed = true
            }
        }

        if (changed) {
            this.#update()
        }
    }

    filter(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: unknown): T[] {
        return this.#items.filter(predicate, thisArg)
    }

    map<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: unknown): U[] {
        return this.#items.map(callbackfn, thisArg)
    }

    reduce<U>(
        callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U,
        initialValue: U
    ): U {
        return this.#items.reduce(callbackfn, initialValue)
    }

    findIndex(predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: unknown): number {
        return this.#items.findIndex(predicate, thisArg)
    }

    removeByIndex(index: number) {
        const oldLength = this.#items.length
        this.#items.splice(index, 1)
        if (oldLength !== this.#items.length) {
            this.#update()
            return true
        }
        return false
    }

    removeByCriteria(predicate: (value: T, index: number) => boolean, thisArg?: unknown) {
        // No default for thisArg. It used to fall back to `window`, which threw
        // outside a browser and made this the one method here that could not run
        // headless — filter, map and findIndex all pass thisArg straight to the
        // native call, where omitting it simply means the callback has no this.
        const items = [] as T[]
        let changed = false
        for (let i = 0; i < this.#items.length; i++) {
            const value = this.#items[i]
            if (predicate.call(thisArg, value, i)) {
                changed = true
            } else {
                items.push(value)
            }
        }
        if (changed) {
            this.#items = items
            this.#update()
        }

        return changed
    }

    join(separator?: string): string {
        return this.#items.join(separator)
    }

    sort(compareFn?: (a: T, b: T) => number) {
        this.#items.sort(compareFn)
        this.#update()
        return this
    }
}
