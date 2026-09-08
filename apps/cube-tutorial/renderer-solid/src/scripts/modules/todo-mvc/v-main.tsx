import { For, Show, type JSX } from 'solid-js'
import { ViewSlot, type ViewProps } from 'wdc-cube-solid'
import { MainScope } from 'wdc-cube-tutorial-presentation/todo-mvc'

import Css from './todo-mvc.module.scss'

export function MainView(props: ViewProps<MainScope>): JSX.Element {
    return (
        <section class={Css.main}>
            <ul class={Css.todoList}>
                <Show when={props.scope.clock}>
                    <ViewSlot scope={props.scope.clock} />
                </Show>

                {/* The one place the granularity is coarse, and it has to be: an
                    ObservableArray is mutated in place and keeps its identity, so
                    what the binding can offer is "something in here moved".
                    `<For>` keys on each scope's own reference, so a row that
                    survives the change keeps its DOM and its state — only the
                    rows that actually came or went are built or dropped. */}
                <For each={[...props.scope.items]}>{(todo) => <ViewSlot scope={todo} />}</For>
            </ul>
        </section>
    )
}
