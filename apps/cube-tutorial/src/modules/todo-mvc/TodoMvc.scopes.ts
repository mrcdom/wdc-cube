import { Scope, observable } from 'wdc-cube'

export type KeyDownEvent = {
    preventDefault: () => void
    code: string
}

export enum ShowingOptions {
    ALL,
    ACTIVE,
    COMPLETED
}

export class HeaderScope extends Scope {
    readonly allItemsCompleted = observable.value(this, false)
    readonly toggleButtonVisible = observable.value(this, false)
    readonly inputValue = observable.value(this, '')

    readonly actions = {
        onSyncInputChange: Scope.SYNC_ACTION as (value: string) => void,
        onSyncInputKeyDown: Scope.SYNC_ACTION as (event: KeyDownEvent) => void,
        onToggleAll: Scope.ASYNC_ACTION
    }
}

export class ClockScope extends Scope {
    readonly date = observable.value(this, new Date())
}

export class ItemScope extends Scope {
    readonly id = observable.value(this, 0)
    readonly completed = observable.value(this, false)
    readonly editing = observable.value(this, false)
    readonly title = observable.value(this, '')

    readonly actions = {
        onDestroy: Scope.ASYNC_ACTION,
        onToggle: Scope.ASYNC_ACTION,
        onEdit: Scope.ASYNC_ACTION,
        onBlur: Scope.SYNC_ACTION as (getValue: () => string) => void,
        onKeyDown: Scope.SYNC_ACTION as (getValue: () => string, event: KeyDownEvent) => void,
    }

}

export class MainScope extends Scope {
    readonly clock = observable.optional<ClockScope>(this)
    readonly items = observable.array<ItemScope>(this)
}

export class FooterScope extends Scope {
    readonly count = observable.value(this, 0)
    readonly activeTodoWord = observable.value(this, 'item')
    readonly clearButtonVisible = observable.value(this, false)
    readonly showing = observable.value(this, ShowingOptions.ALL)

    readonly actions = {
        onClearCompleted: Scope.ASYNC_ACTION,
        onShowAll: Scope.ASYNC_ACTION,
        onShowActives: Scope.ASYNC_ACTION,
        onShowCompleteds: Scope.ASYNC_ACTION
    }
}

export class TodoMvcScope extends Scope {
    readonly header = observable.optional<HeaderScope>(this)
    readonly main = observable.optional<MainScope>(this)
    readonly footer = observable.optional<FooterScope>(this)
}