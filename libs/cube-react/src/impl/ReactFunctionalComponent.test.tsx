import React from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { Application, HistoryManager, Logger, Place, Scope } from 'wdc-cube'

import { getOrCreateApplication } from './ReactFunctionalComponent.js'

class FailingApp extends Application {
    public readonly scope = new Scope()

    constructor() {
        super(Place.ROOT, new HistoryManager())
    }

    public async applyParameters(): Promise<boolean> {
        throw new Error('initialisation failed')
    }
}

describe('getOrCreateApplication', () => {
    // Vitest fails a run on an unhandled rejection, which is what a failed
    // initialisation used to be: the promise was dropped on the floor.
    it('reports a failed initialisation instead of leaving it unhandled', async () => {
        const logged = vi.fn()
        const log = Logger.get('React.FC')
        const previous = log.error
        log.error = logged

        const container = document.createElement('div')
        const root = createRoot(container)

        function App() {
            getOrCreateApplication(React, () => new FailingApp())
            return null
        }

        try {
            React.act(() => root.render(<App />))
            await new Promise((resolve) => setTimeout(resolve, 0))

            expect(logged).toHaveBeenCalledWith('Initializing the application', expect.any(Error))
        } finally {
            React.act(() => root.unmount())
            log.error = previous
        }
    })
})
