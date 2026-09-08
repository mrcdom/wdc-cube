import { createEffect, type JSX } from 'solid-js'
import type { ViewProps } from 'wdc-cube-solid'
import { HeaderScope } from 'wdc-cube-tutorial-presentation/todo-mvc'

import Css from './todo-mvc.module.scss'

let nextInputId = 0

export function HeaderView(props: ViewProps<HeaderScope>): JSX.Element {
    const inputId = `todo-toggle-all-${nextInputId++}`
    let field!: HTMLInputElement

    // The field leads while somebody is typing and the scope mirrors it; this
    // only writes when the presenter is the one changing the value, such as
    // clearing it on Enter. Solid re-runs this when `inputValue` moves and at no
    // other time, so a keystroke never has to race a redraw.
    createEffect(() => {
        const wanted = props.scope.inputValue
        if (field.value !== wanted) {
            field.value = wanted
        }
    })

    return (
        <header>
            <div class={Css.headerInputPane}>
                <input
                    id={inputId}
                    class={Css.toggleAll}
                    type="checkbox"
                    checked={!props.scope.allItemsCompleted}
                    onChange={() => props.scope.actions.onToggleAll()}
                />
                <label for={inputId} style={{ opacity: props.scope.toggleButtonVisible ? 1 : 0 }}>
                    Mark all as complete
                </label>
                <input
                    ref={(node) => (field = node)}
                    class={Css.newTodo}
                    placeholder="What needs to be done?"
                    autofocus
                    onInput={(event) => props.scope.actions.onSyncInputChange(event.currentTarget.value)}
                    onKeyDown={(event) => props.scope.actions.onSyncInputKeyDown(event)}
                />
            </div>
        </header>
    )
}
