import { type JSX } from 'solid-js'
import { ViewSlot, type ViewProps } from 'wdc-cube-solid'
import { TodoMvcScope } from 'wdc-cube-tutorial-presentation/todo-mvc'

import Css from './todo-mvc.module.scss'

export function TodoMvcView(props: ViewProps<TodoMvcScope>): JSX.Element {
    return (
        <div class={Css.todoMvcView}>
            <div class={Css.body}>
                <h1>todos</h1>
                <div class={Css.todoApp}>
                    <ViewSlot scope={props.scope.header} />
                    <ViewSlot scope={props.scope.main} />
                    <ViewSlot scope={props.scope.footer} />
                </div>

                <footer class={Css.info}>
                    <p>
                        {props.scope.stressMode
                            ? 'Stress mode: 1000 generated items and a clock ticking every second.'
                            : 'Showing a small sample list.'}
                    </p>
                    <button class={Css.stressToggle} onClick={() => props.scope.actions.onToggleStress()}>
                        {props.scope.stressMode ? 'Back to the sample list' : 'Run the stress test'}
                    </button>
                </footer>
            </div>
        </div>
    )
}
