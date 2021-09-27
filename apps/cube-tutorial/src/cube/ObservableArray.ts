import { Scope } from 'wdc-cube'

export class ObservableArray<T> implements Iterable<T> {

    private __scope: Scope

    private __items = [] as T[]

    constructor(scope: Scope) {
        this.__scope = scope
    }

    public [Symbol.iterator]() {
        let pos = 0
        const items = this.__items
        return {
            next: function () {
                return {
                    done: pos >= items.length,
                    value: items[pos++]
                }
            }
        }
    }

    public get length() {
        return this.__items.length
    }

    public set length(value: number) {
        if (this.__items.length !== value) {
            this.__items.length = value
            this.__scope.update(this.__scope)
        }
    }

    public get(idx: number) {
        return this.__items[idx]
    }

    public set(idx: number, value: T) {
        const old = this.__items[idx]
        if (old !== value) {
            this.__items[idx] = value
            this.__scope.update(this.__scope)
        }
    }

    public push(value: T) {
        this.__items.push(value)
        this.__scope.update(this.__scope)
    }

    public map<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: unknown): U[] {
        return this.__items.map(callbackfn, thisArg)
    }

    public reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U): U {
        return this.__items.reduce(callbackfn, initialValue)
    }

    public findIndex(predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: unknown): number {
        return this.__items.findIndex(predicate, thisArg)
    }

    public removeByIndex(index: number) {
        const oldLength = this.__items.length
        this.__items.splice(index, 1)
        if (oldLength !== this.__items.length) {
            this.__scope.update(this.__scope)
            return true
        }
        return false
    }

    public removeByCriteria(predicate: (value: T, index: number) => boolean, thisArg?: unknown) {
        const items = [] as T[]
        let changed = false
        for (let i = 0; i < this.__items.length; i++) {
            const value = this.__items[i]
            if (predicate.call(thisArg, value, i)) {
                items.push(value)
            } else {
                changed = true
            }
        }
        if (changed) {
            this.__items = items
            this.__scope.update(this.__scope)
        }
    }

}