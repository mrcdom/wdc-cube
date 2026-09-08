import { DropdownMenu } from '@kobalte/core/dropdown-menu'
import { For, Match, Show, Switch, type JSX } from 'solid-js'
import type { ViewProps } from 'wdc-cube-solid'
import { STATE_LABELS, type IssuePriority, type IssueState } from 'wdc-cube-showcase-presentation/domain'
import { BoardColumnScope, FilterScope, IssueRowScope, IssuesScope } from 'wdc-cube-showcase-presentation/issues'

import { PRIORITY_EMPTY, priorityColour, stateColour } from '../../palette'
import { useDraggableCard, useDropColumn } from './dnd'
import { IssuesTableView } from './v-issues-table'
import Css from './issues.module.scss'

/**
 * The issue list, and the board, which are the same rows twice.
 *
 * Nothing here decides anything. Pressing a filter, a page or a view calls an
 * action, the presenter turns it into a navigation, and this redraws from the
 * scope that comes back — which is why the address bar is always right without a
 * line here being about the address bar.
 */
export function IssuesView(props: ViewProps<IssuesScope>): JSX.Element {
    return (
        <div class={Css.page}>
            <Toolbar scope={props.scope} />

            <div class={Css.scroller}>
                <Show when={props.scope.error}>
                    <p class={Css.error}>{props.scope.error}</p>
                </Show>

                <Show
                    when={!props.scope.loading}
                    fallback={<For each={Array.from({ length: 12 })}>{() => <div class={Css.skeletonRow} />}</For>}
                >
                    <Show
                        when={props.scope.rows.length > 0}
                        fallback={<p class={Css.empty}>Nothing matches those filters.</p>}
                    >
                        <Switch fallback={<IssueList scope={props.scope} />}>
                            <Match when={props.scope.view === 'board'}>
                                <Board scope={props.scope} />
                            </Match>
                            <Match when={props.scope.view === 'table'}>
                                <IssuesTableView scope={props.scope} />
                            </Match>
                        </Switch>
                    </Show>
                </Show>
            </div>

            <Foot scope={props.scope} />
        </div>
    )
}

function Toolbar(props: { scope: IssuesScope }): JSX.Element {
    return (
        <header class={Css.toolbar}>
            <div class={Css.heading}>
                <h1 class={Css.title}>Issues</h1>
                <span class={Css.count}>{props.scope.total}</span>
            </div>

            <div class={Css.viewSwitch}>
                <button
                    classList={{ [Css.viewButton]: true, [Css.viewButtonCurrent]: props.scope.view === 'list' }}
                    onClick={() => props.scope.onShowList()}
                >
                    <Glyph name="list" /> List
                </button>
                <button
                    classList={{ [Css.viewButton]: true, [Css.viewButtonCurrent]: props.scope.view === 'board' }}
                    onClick={() => props.scope.onShowBoard()}
                >
                    <Glyph name="board" /> Board
                </button>
                <button
                    classList={{ [Css.viewButton]: true, [Css.viewButtonCurrent]: props.scope.view === 'table' }}
                    onClick={() => props.scope.onShowTable()}
                >
                    <Glyph name="table" /> Table
                </button>
            </div>

            <For each={props.scope.filters}>{(filter) => <FilterMenu scope={filter} />}</For>

            <div class={Css.spacer} />

            <label class={Css.search}>
                <Glyph name="search" />
                <input
                    type="search"
                    placeholder="Search issues"
                    value={props.scope.search}
                    onInput={(event) => props.scope.onSearchChanged(event.currentTarget.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            props.scope.onSearchSubmitted()
                        }
                    }}
                />
            </label>

            <Show when={props.scope.anyFilterActive}>
                <button class={Css.clear} onClick={() => props.scope.onClearFilters()}>
                    Clear
                </button>
            </Show>
        </header>
    )
}

function FilterMenu(props: { scope: FilterScope }): JSX.Element {
    return (
        <DropdownMenu>
            <DropdownMenu.Trigger classList={{ [Css.chip]: true, [Css.chipActive]: props.scope.active }}>
                {props.scope.summary}
                <Glyph name="chevron" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content class={Css.menu}>
                    <For each={props.scope.options}>
                        {(option) => (
                            <DropdownMenu.Item
                                classList={{ [Css.menuItem]: true, [Css.menuItemCurrent]: option.current }}
                                onSelect={() => option.onSelect()}
                            >
                                {option.label}
                                <Show when={option.current}>
                                    <Glyph name="check" />
                                </Show>
                            </DropdownMenu.Item>
                        )}
                    </For>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu>
    )
}

function IssueList(props: { scope: IssuesScope }): JSX.Element {
    return (
        <div class={Css.list}>
            {/* Keyed on each scope's own reference, so a row that survives a
                redraw keeps its node and whatever state it was holding. */}
            <For each={props.scope.rows}>{(row) => <Row scope={row} />}</For>
        </div>
    )
}

function Row(props: { scope: IssueRowScope }): JSX.Element {
    return (
        <button class={Css.row} onClick={() => props.scope.onOpen()}>
            <PriorityMark priority={props.scope.priority} />
            <span class={Css.reference}>{props.scope.reference}</span>
            <span class={Css.rowTitle}>{props.scope.title}</span>
            <span class={Css.labels}>
                <For each={props.scope.labels}>{(label) => <span class={Css.label}>{label}</span>}</For>
            </span>
            <StatePill state={props.scope.state} />
            <Avatar scope={props.scope} />
            <span class={Css.updated}>{shortDate(props.scope.updatedAt)}</span>
        </button>
    )
}

function Board(props: { scope: IssuesScope }): JSX.Element {
    return (
        <div class={Css.board}>
            <For each={props.scope.columns}>{(column) => <Column scope={column} />}</For>
        </div>
    )
}

function Column(props: { scope: BoardColumnScope }): JSX.Element {
    const drop = useDropColumn((issueId) => props.scope.onReceive(issueId))

    return (
        <section
            ref={(element) => drop.attach(element)}
            classList={{ [Css.column]: true, [Css.columnOver]: drop.over() }}
        >
            <header class={Css.columnHead}>
                <span class={Css.stateDot} style={{ background: stateColour(props.scope.state) }} />
                {props.scope.label}
                <span class={Css.columnCount}>{props.scope.issues.length}</span>
            </header>

            <Show when={props.scope.issues.length > 0} fallback={<p class={Css.columnEmpty}>Drop an issue here</p>}>
                <For each={props.scope.issues}>{(issue) => <Card scope={issue} />}</For>
            </Show>
        </section>
    )
}

function Card(props: { scope: IssueRowScope }): JSX.Element {
    const drag = useDraggableCard(() => props.scope.issueId)

    return (
        <button
            ref={(element) => drag.attach(element)}
            classList={{
                [Css.card]: true,
                [Css.cardDragging]: drag.dragging(),
                [Css.cardMoving]: props.scope.moving
            }}
            onClick={() => props.scope.onOpen()}
        >
            <span class={Css.cardTop}>
                <PriorityMark priority={props.scope.priority} />
                {props.scope.reference}
            </span>
            <span class={Css.cardTitle}>{props.scope.title}</span>
            <span class={Css.cardFoot}>
                <For each={props.scope.labels}>{(label) => <span class={Css.label}>{label}</span>}</For>
                <span style={{ 'flex-grow': 1 }} />
                <Avatar scope={props.scope} />
            </span>
        </button>
    )
}

function Foot(props: { scope: IssuesScope }): JSX.Element {
    const from = () => (props.scope.total === 0 ? 0 : (props.scope.page - 1) * props.scope.perPage + 1)
    const to = () => Math.min(props.scope.page * props.scope.perPage, props.scope.total)

    return (
        <footer class={Css.foot}>
            <span>
                {from()}–{to()} of {props.scope.total}
            </span>
            <div class={Css.spacer} />
            <button
                class={Css.pageButton}
                disabled={props.scope.page <= 1}
                onClick={() => props.scope.onPreviousPage()}
            >
                Previous
            </button>
            <button
                class={Css.pageButton}
                disabled={props.scope.page >= props.scope.pageCount}
                onClick={() => props.scope.onNextPage()}
            >
                Next
            </button>
        </footer>
    )
}

// ========== SMALL PIECES ==========

function Avatar(props: { scope: IssueRowScope }): JSX.Element {
    return (
        <Show
            when={props.scope.assigneeInitials}
            fallback={<span classList={{ [Css.avatar]: true, [Css.avatarEmpty]: true }} aria-hidden="true" />}
        >
            <span
                class={Css.avatar}
                style={{ background: `hsl(${props.scope.assigneeHue} 62% 48%)` }}
                title={props.scope.assigneeName}
            >
                {props.scope.assigneeInitials}
            </span>
        </Show>
    )
}

export function StatePill(props: { state: IssueState }): JSX.Element {
    return (
        <span class={Css.statePill}>
            <span class={Css.stateDot} style={{ background: stateColour(props.state) }} />
            {STATE_LABELS[props.state]}
        </span>
    )
}

/** Priority as four bars, the way a tracker draws it: shape before colour. */
export function PriorityMark(props: { priority: IssuePriority }): JSX.Element {
    const filled = () => ({ urgent: 3, high: 3, medium: 2, low: 1, none: 0 })[props.priority]

    return (
        <svg class={Css.priority} viewBox="0 0 14 14" aria-label={props.priority}>
            <For each={[0, 1, 2]}>
                {(index) => (
                    <rect
                        x={index * 5}
                        y={9 - index * 4}
                        width="3.4"
                        height={4 + index * 4}
                        rx="1"
                        fill={index < filled() ? priorityColour(props.priority) : PRIORITY_EMPTY}
                    />
                )}
            </For>
        </svg>
    )
}

function shortDate(value: string): string {
    if (!value) {
        return ''
    }
    return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const GLYPHS: Record<string, string> = {
    list: 'M3 5h12M3 10h12M3 15h8',
    board: 'M3 3h4v12H3zM8 3h4v8H8zM13 3h2v5h-2z',
    table: 'M2 4h14M2 9h14M2 14h14M7 4v10M12 4v10',
    search: 'M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12ZM16 16l-3.5-3.5',
    chevron: 'M4 7l4 4 4-4',
    check: 'M3 8.5 6.5 12 13 4'
}

function Glyph(props: { name: string }): JSX.Element {
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
        >
            <path d={GLYPHS[props.name] ?? ''} />
        </svg>
    )
}
