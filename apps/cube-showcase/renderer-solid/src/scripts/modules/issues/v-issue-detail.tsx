import { DropdownMenu } from '@kobalte/core/dropdown-menu'
import { Dialog } from '@kobalte/core/dialog'
import { For, Show, type JSX } from 'solid-js'
import type { ViewProps } from 'wdc-cube-solid'
import { ISSUE_PRIORITIES, ISSUE_STATES, PRIORITY_LABELS, STATE_LABELS } from 'wdc-cube-showcase-presentation/domain'
import { IssueDetailScope } from 'wdc-cube-showcase-presentation/issues'

import { PriorityMark, stateColour } from './v-issues'
import Css from './detail.module.scss'

/**
 * One issue, over the list it came from.
 *
 * It is a place, not a piece of view state: the URL names the open issue, so a
 * link opens straight into it, a reload leaves it open, and Back closes it. The
 * list underneath was never unmade.
 */
export function IssueDetailView(props: ViewProps<IssueDetailScope>): JSX.Element {
    return (
        <div class={Css.detail}>
            <header class={Css.head}>
                <span class={Css.reference}>{props.scope.reference}</span>
                <div class={Css.spacer} />
                <Show when={props.scope.saving}>
                    <span class={Css.saving}>Saving…</span>
                </Show>
                <button class={Css.close} aria-label="Close" onClick={() => props.scope.onClose()}>
                    <Cross />
                </button>
            </header>

            <Show when={props.scope.error} fallback={null}>
                <p class={Css.error}>{props.scope.error}</p>
            </Show>

            <Show when={!props.scope.loading && !props.scope.error} fallback={<Loading scope={props.scope} />}>
                <div class={Css.body}>
                    <Dialog.Title class={Css.title}>{props.scope.title}</Dialog.Title>
                    <Dialog.Description class={Css.description}>{props.scope.description}</Dialog.Description>

                    <Show when={props.scope.labels.length > 0}>
                        <div class={Css.labels}>
                            <For each={props.scope.labels}>{(label) => <span class={Css.label}>{label}</span>}</For>
                        </div>
                    </Show>

                    <dl class={Css.properties}>
                        <dt class={Css.propertyLabel}>Status</dt>
                        <dd>
                            <Chooser
                                current={STATE_LABELS[props.scope.state]}
                                mark={
                                    <span
                                        style={{
                                            width: '7px',
                                            height: '7px',
                                            'border-radius': '50%',
                                            background: stateColour(props.scope.state)
                                        }}
                                    />
                                }
                                options={ISSUE_STATES.map((state) => ({
                                    value: state,
                                    label: STATE_LABELS[state]
                                }))}
                                onChoose={(value) => props.scope.onChangeState(value)}
                            />
                        </dd>

                        <dt class={Css.propertyLabel}>Priority</dt>
                        <dd>
                            <Chooser
                                current={PRIORITY_LABELS[props.scope.priority]}
                                mark={<PriorityMark priority={props.scope.priority} />}
                                options={ISSUE_PRIORITIES.map((priority) => ({
                                    value: priority,
                                    label: PRIORITY_LABELS[priority]
                                }))}
                                onChoose={(value) => props.scope.onChangePriority(value)}
                            />
                        </dd>

                        <dt class={Css.propertyLabel}>Assignee</dt>
                        <dd class={Css.plain}>{props.scope.assigneeName ?? 'Nobody yet'}</dd>

                        <dt class={Css.propertyLabel}>Updated</dt>
                        <dd class={Css.plain}>{longDate(props.scope.updatedAt)}</dd>
                    </dl>
                </div>
            </Show>
        </div>
    )
}

function Loading(props: { scope: IssueDetailScope }): JSX.Element {
    return (
        <Show when={!props.scope.error}>
            <p class={Css.loading}>Loading…</p>
        </Show>
    )
}

function Chooser(props: {
    current: string
    mark: JSX.Element
    options: { value: string; label: string }[]
    onChoose: (value: string) => void
}): JSX.Element {
    return (
        <DropdownMenu>
            <DropdownMenu.Trigger class={Css.select}>
                {props.mark}
                {props.current}
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content class={Css.menu}>
                    <For each={props.options}>
                        {(option) => (
                            <DropdownMenu.Item class={Css.menuItem} onSelect={() => props.onChoose(option.value)}>
                                {option.label}
                            </DropdownMenu.Item>
                        )}
                    </For>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu>
    )
}

function Cross(): JSX.Element {
    return (
        <svg
            width="15"
            height="15"
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
        >
            <path d="m5 5 8 8M13 5l-8 8" />
        </svg>
    )
}

function longDate(value: string): string {
    if (!value) {
        return ''
    }
    return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}
