/**
 * Copyright © 2025 WeDoCode Consultoria e Soluções Avançadas LTDA. All rights reserved.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import { NOOP_VOID, type Scope } from 'wdc-cube'

/**
 * Counts the redraws a presenter asks for.
 *
 * This is not a stand-in view. It answers `forceUpdate` and does nothing else,
 * because which scopes a presenter marks — and which it leaves alone — is part
 * of the presentation layer's behaviour, not of any view's. It is the only way
 * to state "editing one item redrew that item and not the other nine hundred"
 * without rendering anything.
 */
export class ScopeUpdateRecorder {
    private readonly counts = new Map<Scope, number>()

    private readonly restorers: (() => void)[] = []

    /** Records redraws asked of `scope`. Returns the scope, so it can wrap a lookup. */
    public watch<S extends Scope>(scope: S): S {
        if (this.counts.has(scope)) {
            return scope
        }

        this.counts.set(scope, 0)

        const previous = scope.forceUpdate
        scope.forceUpdate = () => {
            this.counts.set(scope, (this.counts.get(scope) ?? 0) + 1)
            previous()
        }

        this.restorers.push(() => {
            scope.forceUpdate = previous ?? NOOP_VOID
        })

        return scope
    }

    /** Records redraws asked of every scope given. */
    public watchAll(scopes: Iterable<Scope>): void {
        for (const scope of scopes) {
            this.watch(scope)
        }
    }

    /** How many redraws were asked of `scope`; zero for one never watched. */
    public countOf(scope: Scope): number {
        return this.counts.get(scope) ?? 0
    }

    /** The watched scopes that were asked to redraw at least once. */
    public get updated(): Scope[] {
        return [...this.counts.entries()].filter(([, count]) => count > 0).map(([scope]) => scope)
    }

    /** Total redraws across every watched scope. */
    public get total(): number {
        let total = 0
        for (const count of this.counts.values()) {
            total += count
        }
        return total
    }

    /** Sets every count back to zero, keeping the scopes watched. */
    public reset(): void {
        for (const scope of this.counts.keys()) {
            this.counts.set(scope, 0)
        }
    }

    /** Hands every watched scope its original `forceUpdate` back. */
    public release(): void {
        for (const restore of this.restorers) {
            restore()
        }
        this.restorers.length = 0
        this.counts.clear()
    }
}
