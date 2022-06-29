import { Observable, ObservableArray, observe, Scope } from 'wdc-cube'
import { ShowingOptions } from './TodoMvc.keys'

export { ShowingOptions }

export type KeyDownEvent = {
    preventDefault: () => void
    code: string
}

@Observable
export class HeaderScope extends Scope {
    @observe() allItemsCompleted = false
    @observe() toggleButtonVisible = false
    @observe() inputValue = ''

    readonly actions = {
        onSyncInputChange: Scope.SYNC_ACTION as (value: string) => void,
        onSyncInputKeyDown: Scope.SYNC_ACTION as (event: KeyDownEvent) => void,
        onToggleAll: Scope.ASYNC_ACTION
    }
}

@Observable
export class ClockScope extends Scope {
    @observe() date = new Date()
}

@Observable
export class ItemScope extends Scope {
    @observe() id = 0
    @observe() completed = false
    @observe() editing = false
    @observe() title = ''

    readonly actions = {
        onDestroy: Scope.ASYNC_ACTION,
        onToggle: Scope.ASYNC_ACTION,
        onEdit: Scope.ASYNC_ACTION,
        onBlur: Scope.SYNC_ACTION as (getValue: () => string) => void,
        onKeyDown: Scope.SYNC_ACTION as (getValue: () => string, event: KeyDownEvent) => void
    }
}

@Observable
export class MainScope extends Scope {
    @observe() clock?: ClockScope
    readonly items = new ObservableArray<ItemScope>(this)
}

@Observable
export class FooterScope extends Scope {
    @observe() count = 0
    @observe() activeTodoWord = 'item'
    @observe() clearButtonVisible = false
    @observe() showing = ShowingOptions.ALL

    readonly actions = {
        onClearCompleted: Scope.ASYNC_ACTION,
        onShowAll: Scope.ASYNC_ACTION,
        onShowActives: Scope.ASYNC_ACTION,
        onShowCompleteds: Scope.ASYNC_ACTION
    }
}

@Observable
export class TodoMvcScope extends Scope {
    @observe() header?: HeaderScope
    @observe() main?: MainScope
    @observe() footer?: FooterScope
}
