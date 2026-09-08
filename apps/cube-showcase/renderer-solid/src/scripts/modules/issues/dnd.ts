import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { createSignal, onCleanup, type Accessor } from 'solid-js'

/**
 * Dragging a card between columns.
 *
 * `@atlaskit/pragmatic-drag-and-drop` is framework-agnostic — it attaches to DOM
 * elements and reports through callbacks — so there is no Solid adapter to go
 * stale, which the one Solid-specific library did in 2023. It is also the
 * library Jira and Trello are built on, which is the shape being copied here.
 *
 * What crosses into the presenter is the issue's id and the column's state.
 * Nothing about pointers, elements or the drag itself: the presenter is told
 * that an issue was put somewhere, which is a fact about the data.
 */

type Payload = { issueId: string }

const isPayload = (data: Record<string | symbol, unknown>): data is Payload => typeof data.issueId === 'string'

/** Makes a card draggable, and says while it is being dragged. */
export function useDraggableCard(issueId: () => string) {
    const [dragging, setDragging] = createSignal(false)

    const attach = (element: HTMLElement) => {
        const stop = draggable({
            element,
            getInitialData: () => ({ issueId: issueId() }),
            onDragStart: () => setDragging(true),
            onDrop: () => setDragging(false)
        })
        onCleanup(stop)
    }

    return { attach, dragging: dragging as Accessor<boolean> }
}

/** Makes a column take cards, and says while one is over it. */
export function useDropColumn(onReceive: (issueId: string) => void) {
    const [over, setOver] = createSignal(false)

    const attach = (element: HTMLElement) => {
        const stop = combine(
            dropTargetForElements({
                element,
                canDrop: ({ source }) => isPayload(source.data),
                onDragEnter: () => setOver(true),
                onDragLeave: () => setOver(false),
                onDrop: ({ source }) => {
                    setOver(false)
                    if (isPayload(source.data)) {
                        onReceive(source.data.issueId)
                    }
                }
            })
        )
        onCleanup(stop)
    }

    return { attach, over: over as Accessor<boolean> }
}
