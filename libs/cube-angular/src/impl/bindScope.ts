/**
 * Copyright © 2017-2026 WeDoCode Consultoria e Soluções Avançadas LTDA.
 * Licensed under the MIT License. See LICENSE in the project root.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import { ChangeDetectorRef, DestroyRef, type Signal, effect, inject } from '@angular/core'
import { NOOP_VOID, Scope } from 'wdc-cube'

/**
 * Connects a scope to the component that renders it, so the presenter's
 * `update()` reaches Angular.
 *
 * A scope's whole contract with a view is `forceUpdate`: the update pipeline
 * calls it once per flush for every scope it marked dirty. Here that becomes
 * `markForCheck()`, which is what a zoneless application expects — Angular no
 * longer discovers changes on its own, so the notification has to be explicit.
 * Nothing else in the component tree is checked as a result.
 *
 * Call it from the constructor, passing the scope input:
 *
 * ```ts
 * @Component({ changeDetection: ChangeDetectionStrategy.OnPush, ... })
 * export class ItemView {
 *     readonly scope = input.required<ItemScope>()
 *
 *     constructor() {
 *         bindScope(this.scope)
 *     }
 * }
 * ```
 *
 * The binding follows the signal, so a component reused for a different scope
 * releases the previous one, and it is released again on destroy. That matters
 * because `forceUpdate` is a single slot: leaving a stale binding would let a
 * destroyed component keep answering for a live scope.
 */
export function bindScope(scope: Signal<Scope | undefined | null>): void {
    const changeDetector = inject(ChangeDetectorRef)
    const redraw = () => changeDetector.markForCheck()

    let bound: Scope | undefined | null

    const release = () => {
        // Only release what is still ours: another component may have bound
        // this scope in the meantime, and clearing it would silence that one.
        if (bound && bound.forceUpdate === redraw) {
            bound.forceUpdate = NOOP_VOID
        }
        bound = undefined
    }

    effect(() => {
        const current = scope()
        if (current === bound) {
            return
        }

        release()

        if (current) {
            current.forceUpdate = redraw
            bound = current
        }
    })

    inject(DestroyRef).onDestroy(release)
}
