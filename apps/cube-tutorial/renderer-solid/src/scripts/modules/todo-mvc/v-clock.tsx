import { type JSX } from 'solid-js'
import type { ViewProps } from 'wdc-cube-solid'
import { ClockScope } from 'wdc-cube-tutorial-presentation/todo-mvc'

import Css from './todo-mvc.module.scss'

export function ClockView(props: ViewProps<ClockScope>): JSX.Element {
    return (
        <li class={Css.clock}>
            <div>{props.scope.date.toLocaleTimeString()}</div>
        </li>
    )
}
