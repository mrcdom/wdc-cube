import { For, Show, type JSX } from 'solid-js'
import type { ViewProps } from 'wdc-cube-solid'
import { FooterScope, ShowingOptions } from 'wdc-cube-tutorial-presentation/todo-mvc'

import Css from './todo-mvc.module.scss'

export function FooterView(props: ViewProps<FooterScope>): JSX.Element {
    const filters = () =>
        [
            { showing: ShowingOptions.ALL, label: 'All', select: () => props.scope.actions.onShowAll() },
            { showing: ShowingOptions.ACTIVE, label: 'Active', select: () => props.scope.actions.onShowActives() },
            {
                showing: ShowingOptions.COMPLETED,
                label: 'Completed',
                select: () => props.scope.actions.onShowCompleteds()
            }
        ] as const

    return (
        <footer class={Css.footer}>
            <span class={Css.todoCount}>
                <strong>{props.scope.count}</strong> {props.scope.activeTodoWord} left
            </span>

            <ul class={Css.filters}>
                <For each={filters()}>
                    {(filter) => (
                        <li>
                            <a
                                classList={{ [Css.selected]: props.scope.showing === filter.showing }}
                                onClick={filter.select}
                            >
                                {filter.label}
                            </a>
                        </li>
                    )}
                </For>
            </ul>

            <Show when={props.scope.clearButtonVisible}>
                <button class={Css.clearCompleted} onClick={() => props.scope.actions.onClearCompleted()}>
                    Clear completed
                </button>
            </Show>
        </footer>
    )
}
