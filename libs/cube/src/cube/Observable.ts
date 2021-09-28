import { Scope } from './Scope'
import { ObservableArray } from './ObservableArray'

export const observable = {

    value: <T>(scope: Scope, value: T) => {
        let oldValue = value
        return function (newValue?: T) {
            if (arguments.length === 1 && oldValue !== newValue && newValue !== undefined) {
                const old = oldValue
                oldValue = newValue
                scope.update(scope)
                return old
            }

            return oldValue
        }
    },

    optional: <T>(scope: Scope) => {
        let oldValue: T | undefined
        return function (newValue?: T) {
            if (arguments.length === 1 && oldValue !== newValue) {
                const old = oldValue
                oldValue = newValue
                scope.update(scope)
                return old
            }

            return oldValue
        }
    },

    array: <T>(scope: Scope) => {
        return new ObservableArray<T>(scope)
    }

}