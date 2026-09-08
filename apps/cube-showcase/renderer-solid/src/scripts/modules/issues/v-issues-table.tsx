import { createTable, FlexRender, rowSortingFeature, tableFeatures } from '@tanstack/solid-table'
import type { ColumnDef } from '@tanstack/solid-table'
import { For, type JSX } from 'solid-js'
import { IssueRowScope, IssuesScope } from 'wdc-cube-showcase-presentation/issues'

import { PriorityMark, StatePill } from './v-issues'
import Css from './table.module.scss'

/**
 * The same issues again, through TanStack Table.
 *
 * A table library is the hard case for an architecture like this one, because it
 * arrives wanting to own exactly what the architecture says belongs elsewhere:
 * the sort, the page, the filters. So it is told not to.
 *
 * Features in v9 are opt-in, and the one taken here is `rowSortingFeature`
 * *without* a sorted row model — the library learns that a column can be sorted
 * and which one currently is, and never sorts anything. Pagination is not asked
 * for at all, because what arrives is already the page the reader asked for.
 *
 * What the library does is what it is good at and what is tedious by hand:
 * column definitions, header groups, cell rendering, and the plumbing between
 * them. What it does not do is remember anything, because a sorted table has to
 * be a link you can send, and Back has to undo the sort. Neither is true of a
 * table that keeps its own state.
 */
const features = tableFeatures({ rowSortingFeature })

const columns: ColumnDef<typeof features, IssueRowScope>[] = [
    {
        accessorKey: 'reference',
        header: 'ID',
        cell: (info) => <span class={Css.reference}>{String(info.getValue())}</span>
    },
    {
        accessorKey: 'priority',
        header: 'Priority',
        cell: (info) => (
            <span class={Css.priorityCell}>
                <PriorityMark priority={info.row.original.priority} />
                {info.row.original.priority}
            </span>
        )
    },
    {
        accessorKey: 'title',
        header: 'Title',
        cell: (info) => <span class={Css.title}>{String(info.getValue())}</span>
    },
    {
        accessorKey: 'state',
        header: 'Status',
        cell: (info) => <StatePill state={info.row.original.state} />
    },
    {
        accessorKey: 'assigneeName',
        header: 'Assignee',
        enableSorting: false,
        cell: (info) => <span class={Css.muted}>{info.row.original.assigneeName ?? '—'}</span>
    },
    {
        accessorKey: 'updatedAt',
        header: 'Updated',
        cell: (info) => <span class={Css.muted}>{shortDate(info.row.original.updatedAt)}</span>
    }
]

export function IssuesTableView(props: { scope: IssuesScope }): JSX.Element {
    const table = createTable({
        features,
        get data() {
            return props.scope.rows
        },
        columns,
        state: {
            get sorting() {
                return props.scope.sortField ? [{ id: props.scope.sortField, desc: props.scope.sortDescending }] : []
            }
        },
        // The rows arrive already sorted and already paged. `manualSorting` is
        // what stops the library re-sorting the page it was handed, which is not
        // the same thing as sorting the list. There is no `manualPagination` to
        // set because pagination was never enabled — in v9 a feature you do not
        // ask for is not there to be turned off, which is the same thought this
        // architecture has about state.
        manualSorting: true,
        // Sorting is a navigation, so the presenter hears it rather than the
        // table's own state.
        onSortingChange: () => undefined
    })

    return (
        <table class={Css.table}>
            <thead>
                <For each={table.getHeaderGroups()}>
                    {(group) => (
                        <tr>
                            <For each={group.headers}>
                                {(header) => (
                                    <th
                                        classList={{
                                            [Css.sortable]: header.column.getCanSort(),
                                            [Css.sorted]: props.scope.sortField === header.column.id
                                        }}
                                        onClick={() => {
                                            if (header.column.getCanSort()) {
                                                props.scope.onSort(header.column.id)
                                            }
                                        }}
                                    >
                                        <FlexRender header={header} />
                                        <SortMark
                                            active={props.scope.sortField === header.column.id}
                                            descending={props.scope.sortDescending}
                                        />
                                    </th>
                                )}
                            </For>
                        </tr>
                    )}
                </For>
            </thead>
            <tbody>
                <For each={table.getRowModel().rows}>
                    {(row) => (
                        <tr class={Css.row} onClick={() => row.original.onOpen()}>
                            <For each={row.getAllCells()}>
                                {(cell) => (
                                    <td>
                                        <FlexRender cell={cell} />
                                    </td>
                                )}
                            </For>
                        </tr>
                    )}
                </For>
            </tbody>
        </table>
    )
}

function SortMark(props: { active: boolean; descending: boolean }): JSX.Element {
    return (
        <svg
            classList={{ [Css.sortMark]: true, [Css.sortMarkActive]: props.active }}
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
        >
            <path d={props.active && props.descending ? 'M3 5l3 3 3-3' : 'M3 7l3-3 3 3'} />
        </svg>
    )
}

function shortDate(value: string): string {
    if (!value) {
        return ''
    }
    return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
