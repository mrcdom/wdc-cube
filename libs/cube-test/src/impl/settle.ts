/**
 * Copyright © 2025 WeDoCode Consultoria e Soluções Avançadas LTDA. All rights reserved.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

import { CallbackManager } from 'wdc-cube'

const callbackManager = CallbackManager.singleton()

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

export type SettleOptions = {
    /**
     * How many flush rounds to allow before giving up. Exceeding it means
     * something is updating in a loop, which is a defect worth failing on rather
     * than hanging over.
     */
    maxRounds?: number
}

/**
 * Waits until the presentation layer has stopped moving.
 *
 * A presenter does not redraw on the spot: it marks scopes and lets
 * `CallbackManager` batch them onto the next frame, sixteen milliseconds away.
 * A test that asserts straight after an action therefore reads the scope tree
 * mid-flight. Sleeping past the timer would work and would be a guess; this
 * drains the queue deliberately instead, and repeats, because a scope updated
 * during `onBeforeScopeUpdate` schedules another round.
 */
export async function settle(options?: SettleOptions): Promise<void> {
    const maxRounds = options?.maxRounds ?? 20

    for (let round = 0; round < maxRounds; round++) {
        // Yield first: an action may still be suspended between awaits, and what
        // it does after resuming is part of what has to settle.
        await tick()

        if (!callbackManager.hasPendingCallbacks) {
            return
        }

        callbackManager.flush()
    }

    throw new Error(
        `Scope updates did not settle after ${maxRounds} rounds. ` +
            'Something is scheduling an update from within an update.'
    )
}
