/**
 * Copyright © 2025 WeDoCode Consultoria e Soluções Avançadas LTDA. All rights reserved.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

export type SyncedRowsOptions<T, R extends Element> = {
    /** Builds the element for an item that has no row yet. */
    create: (item: T) => R

    /**
     * Hands a row its item. Defaults to assigning `scope`, which is what a view
     * built on {@link CubeElement} wants.
     */
    assign?: (row: R, item: T) => void

    /**
     * What identifies an item across updates.
     *
     * Required, with no default, because getting it wrong is invisible: the list
     * still reads correctly and only the state a row was holding goes to the
     * wrong item. Whether the item is already its own identity depends on where
     * it came from, and only the caller knows that.
     *
     * A scope usually is — one object for as long as the item exists, so
     * `(scope) => scope` is right. Data fetched from a service usually is not:
     * hand back a fresh object for the same row and every row is rebuilt, so key
     * on the id instead.
     */
    key: (item: T) => unknown
}

/**
 * Keeps a container's children in step with a list, by identity.
 *
 * Reusing rows by position is the obvious thing and it is subtly wrong: take an
 * item out of the middle and every row below it is handed a different item than
 * it had. Nothing looks broken — the list reads correctly a frame later — but
 * anything the row was holding moves with the position rather than the item. An
 * editor opened on the fourth todo ends up on the fifth; focus, selection and a
 * half-finished drag do the same.
 *
 * So rows are matched by key instead. A row that already had this item keeps it,
 * and keeps whatever state it was holding; only rows whose item is gone are
 * removed, and only items with no row are built. What remains is reordering, and
 * the DOM is moved only where it actually disagrees.
 *
 * ```ts
 * private readonly items = new SyncedRows<ItemScope, ItemView>({
 *     key: (scope) => scope,
 *     create: () => new ItemView()
 * })
 *
 * protected override onUpdate() {
 *     this.items.sync(this.list, this.scope.items.map((item) => item))
 * }
 * ```
 */
export class SyncedRows<T, R extends Element> {
    private byKey = new Map<unknown, R>()

    private readonly create: (item: T) => R

    private readonly assign: (row: R, item: T) => void

    private readonly keyOf: (item: T) => unknown

    public constructor(options: SyncedRowsOptions<T, R>) {
        this.create = options.create
        this.keyOf = options.key
        this.assign =
            options.assign ??
            ((row, item) => {
                ;(row as unknown as { scope: T }).scope = item
            })
    }

    /** The rows currently on screen, in no particular order. */
    public get all(): R[] {
        return [...this.byKey.values()]
    }

    /** The row holding `item`, if there is one. */
    public find(item: T): R | undefined {
        return this.byKey.get(this.keyOf(item))
    }

    /** Removes every row. */
    public clear(): void {
        for (const row of this.byKey.values()) {
            row.remove()
        }
        this.byKey.clear()
    }

    /**
     * Makes `container` hold exactly one row per item, in order.
     *
     * Rows are placed at the end of the container, so anything declared before
     * them — a slot for something else, a heading — stays where it is. Rows are
     * expected to be contiguous and last; nothing else may sit between them.
     */
    public sync(container: Element, items: readonly T[]): void {
        const next = new Map<unknown, R>()

        for (const item of items) {
            const key = this.keyOf(item)

            if (next.has(key)) {
                // Two items claiming one identity collapses the list to a single
                // row, silently. The usual cause is a key that was never set, so
                // every item answers `undefined`.
                throw new Error(
                    `Two items share the key ${String(key)}. ` +
                        'A key must identify exactly one item; check that it is being assigned.'
                )
            }

            const row = this.byKey.get(key) ?? this.create(item)
            this.assign(row, item)
            next.set(key, row)
        }

        // Whatever is no longer wanted. Removing an element runs its
        // disconnectedCallback, which is where a view hands back its scope.
        for (const [key, row] of this.byKey) {
            if (next.get(key) !== row) {
                row.remove()
            }
        }

        this.byKey = next
        this.reorder(container, next)
    }

    /**
     * Walks the wanted order against what is there, moving only what disagrees.
     * A list whose order did not change touches the DOM not at all.
     */
    private reorder(container: Element, wanted: Map<unknown, R>): void {
        const owned = new Set<Node>(wanted.values())

        // Skip whatever was declared before the rows, so it is not stepped on.
        let cursor: Node | null = container.firstChild
        while (cursor && !owned.has(cursor)) {
            cursor = cursor.nextSibling
        }

        for (const row of wanted.values()) {
            if (cursor === row) {
                cursor = cursor.nextSibling
                continue
            }
            container.insertBefore(row, cursor)
        }
    }
}
