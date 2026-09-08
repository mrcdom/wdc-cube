import { For, Show, type JSX } from 'solid-js'
import type { ViewProps } from 'wdc-cube-solid'
import { CycleCardScope, CyclesScope } from 'wdc-cube-showcase-presentation/cycles'

import Css from './cycles.module.scss'

export function CyclesView(props: ViewProps<CyclesScope>): JSX.Element {
    return (
        <div class={Css.page}>
            <h1 class={Css.title}>Cycles</h1>
            <p class={Css.subtitle}>
                Opening one filters the issue list by it — the filter is a place, so the link carries it.
            </p>

            <Show when={props.scope.error}>
                <p class={Css.error}>{props.scope.error}</p>
            </Show>

            <div class={Css.list}>
                <Show
                    when={!props.scope.loading}
                    fallback={<For each={[0, 1, 2]}>{() => <div class={Css.skeleton} />}</For>}
                >
                    <For each={props.scope.cycles}>{(cycle) => <CycleCard scope={cycle} />}</For>
                </Show>
            </div>
        </div>
    )
}

function CycleCard(props: { scope: CycleCardScope }): JSX.Element {
    return (
        <button
            classList={{ [Css.card]: true, [Css.cardActive]: props.scope.active }}
            onClick={() => props.scope.onOpen()}
        >
            <span class={Css.name}>
                {props.scope.name}
                <Show when={props.scope.active}>
                    <span class={Css.badge}>Active</span>
                </Show>
            </span>
            <span class={Css.figures}>
                {props.scope.done} / {props.scope.total} done
            </span>
            <span class={Css.dates}>
                {shortDate(props.scope.startsAt)} — {shortDate(props.scope.endsAt)}
            </span>
            <span class={Css.bar}>
                <span class={Css.barFill} style={{ width: `${props.scope.progress}%` }} />
            </span>
        </button>
    )
}

function shortDate(value: string): string {
    if (!value) {
        return ''
    }
    return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
