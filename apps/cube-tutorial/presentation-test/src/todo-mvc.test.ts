import { afterEach, describe, expect, it, vi } from 'vitest'

import { ScopeUpdateRecorder } from 'wdc-cube-test'
import { TutorialService } from 'wdc-cube-tutorial-presentation'
import { MainPresenter } from 'wdc-cube-tutorial-presentation/main'
import { ShowingOptions, TodoMvcScope } from 'wdc-cube-tutorial-presentation/todo-mvc'

import { holdCalls, startTutorial, type Harness } from './harness'

let harness: Harness | undefined

afterEach(() => {
    harness?.release()
    harness = undefined
})

const todos = (h: Harness) => h.scope.body as TodoMvcScope
const titles = (h: Harness) => todos(h).main?.items.map((item) => item.title) ?? []
const active = (h: Harness) => todos(h).footer?.count ?? -1

async function type(h: Harness, text: string) {
    const header = todos(h).header
    header?.actions.onSyncInputChange(text)
    header?.actions.onSyncInputKeyDown({ code: 'Enter', preventDefault: () => void 0 })
    await h.settle()
}

describe('todo-mvc', () => {
    it('starts on the sample list, counting only what is active', async () => {
        harness = await startTutorial('/todos')

        expect(titles(harness)).toEqual([
            'Walk the dog',
            'Write an app',
            'Go to school',
            'Watch Michael Reeves',
            'Add automatic deployment'
        ])
        expect(active(harness)).toEqual(2)
    })

    // The identity a view reconciles a list on. It lives on the scope because
    // otherwise every view decides it separately — which is how this repository
    // ended up with React keying on the id and one binding on the instance.
    it('gives every item an identity that follows the data', async () => {
        harness = await startTutorial('/todos')

        const items = todos(harness).main!.items
        const identities = items.map((item) => item.identity)

        expect(identities).toEqual(items.map((item) => item.id))
        expect(new Set(identities).size).toEqual(identities.length)
    })

    it('gives a newly added item an identity too', async () => {
        harness = await startTutorial('/todos')

        await type(harness, 'Write the tests')

        const items = todos(harness).main!.items
        const added = items.get(items.length - 1)
        expect(added.identity).toEqual(added.id)
    })

    it('adds what was typed and clears the field', async () => {
        harness = await startTutorial('/todos')

        await type(harness, 'Write the tests')

        expect(titles(harness)).toContain('Write the tests')
        expect(active(harness)).toEqual(3)
        expect(todos(harness).header?.inputValue).toEqual('')
    })

    it('ignores an empty entry', async () => {
        harness = await startTutorial('/todos')
        const before = titles(harness).length

        await type(harness, '   ')

        expect(titles(harness).length).toEqual(before)
    })

    it('moves an item between active and completed when toggled', async () => {
        harness = await startTutorial('/todos')
        const walk = todos(harness).main!.items.get(0)

        await walk.actions.onToggle()
        await harness.settle()
        expect(walk.completed).toEqual(true)
        expect(active(harness)).toEqual(1)

        await walk.actions.onToggle()
        await harness.settle()
        expect(active(harness)).toEqual(2)
    })

    it('removes the item asked for and leaves the rest', async () => {
        harness = await startTutorial('/todos')

        await todos(harness).main!.items.get(1).actions.onDestroy()
        await harness.settle()

        expect(titles(harness)).toEqual([
            'Walk the dog',
            'Go to school',
            'Watch Michael Reeves',
            'Add automatic deployment'
        ])
    })

    // Regression. The predicate handed to removeByCriteria was negated, so this
    // dropped the active items and kept the completed ones — since the tutorial
    // was first written.
    it('clears the completed items, keeping the active ones', async () => {
        harness = await startTutorial('/todos')

        await todos(harness).footer!.actions.onClearCompleted()
        await harness.settle()

        expect(titles(harness)).toEqual(['Walk the dog', 'Go to school'])
        expect(active(harness)).toEqual(2)
    })

    it('hides the clear button exactly when nothing is completed', async () => {
        harness = await startTutorial('/todos')
        expect(todos(harness).footer?.clearButtonVisible).toEqual(true)

        await todos(harness).footer!.actions.onClearCompleted()
        await harness.settle()

        expect(todos(harness).footer?.clearButtonVisible).toEqual(false)
    })

    describe('filters', () => {
        it('narrows the list and says so in the address', async () => {
            harness = await startTutorial('/todos')

            await todos(harness).footer!.actions.onShowActives()
            await harness.settle()
            expect(titles(harness)).toEqual(['Walk the dog', 'Go to school'])
            expect(todos(harness).footer?.showing).toEqual(ShowingOptions.ACTIVE)
            expect(harness.history.token).toEqual('/todos?tm-showing=1')

            await todos(harness).footer!.actions.onShowCompleteds()
            await harness.settle()
            expect(titles(harness)).toEqual(['Write an app', 'Watch Michael Reeves', 'Add automatic deployment'])

            await todos(harness).footer!.actions.onShowAll()
            await harness.settle()
            expect(titles(harness).length).toEqual(5)
        })

        it('is restored from the address', async () => {
            harness = await startTutorial('/todos?tm-showing=2')

            expect(todos(harness).footer?.showing).toEqual(ShowingOptions.COMPLETED)
            expect(titles(harness)).toEqual(['Write an app', 'Watch Michael Reeves', 'Add automatic deployment'])
        })
    })

    describe('editing', () => {
        it('commits the new title on Enter', async () => {
            harness = await startTutorial('/todos')
            const item = todos(harness).main!.items.get(2)

            await item.actions.onEdit()
            await harness.settle()
            expect(item.editing).toEqual(true)

            item.actions.onKeyDown(() => 'Go to school early', { code: 'Enter', preventDefault: () => void 0 })
            await harness.settle()

            expect(item.editing).toEqual(false)
            expect(titles(harness)).toContain('Go to school early')
        })

        it('drops the item when the new title is blank', async () => {
            harness = await startTutorial('/todos')
            const item = todos(harness).main!.items.get(2)

            await item.actions.onEdit()
            await harness.settle()
            item.actions.onKeyDown(() => '  ', { code: 'Enter', preventDefault: () => void 0 })
            await harness.settle()

            expect(titles(harness)).not.toContain('Go to school')
            expect(titles(harness).length).toEqual(4)
        })
    })

    describe('stress mode', () => {
        it('goes in and back out through the address', async () => {
            harness = await startTutorial('/todos')

            await todos(harness).actions.onToggleStress()
            await harness.settle()
            expect(todos(harness).stressMode).toEqual(true)
            expect(todos(harness).main?.items.length).toEqual(1000)
            expect(todos(harness).main?.clock).toBeDefined()

            await todos(harness).actions.onToggleStress()
            await harness.settle()
            expect(todos(harness).stressMode).toEqual(false)
            expect(todos(harness).main?.items.length).toEqual(5)
            expect(todos(harness).main?.clock).toBeUndefined()
        })

        // Regression, and the reason the Angular binding needed a framework fix:
        // a base update used to discard the nested scopes recorded alongside it,
        // on the assumption that redrawing a root redraws everything under it.
        // That holds in React and not in a view told only what changed.
        it('marks the clock without marking every item', async () => {
            harness = await startTutorial('/todos?tm-uid=-1')
            const main = todos(harness).main!
            const clock = main.clock!

            const recorder = new ScopeUpdateRecorder()
            try {
                recorder.watch(clock)
                recorder.watchAll(main.items.filter((_, index) => index < 50))

                // What the ticking clock does once a second.
                clock.date = new Date(clock.date.getTime() + 1000)
                clock.update(clock)
                await harness.settle()

                expect(recorder.countOf(clock)).toBeGreaterThan(0)
                expect(recorder.updated).toEqual([clock])
            } finally {
                recorder.release()
            }
        })
    })

    describe('the address', () => {
        // The address is outside input. The keys hand back only usable values, and
        // since the same keys publish, whatever was refused drops out of the address.
        it('ignores a filter it does not know', async () => {
            harness = await startTutorial('/todos?tm-showing=99')

            expect(todos(harness).footer?.showing).toEqual(ShowingOptions.ALL)
            expect(titles(harness).length).toEqual(5)
            expect(harness.history.token).toEqual('/todos')
        })

        it('ignores a list id it cannot read', async () => {
            harness = await startTutorial('/todos?tm-uid=abc')

            expect(titles(harness).length).toEqual(5)
            expect(harness.history.token).toEqual('/todos')
        })
    })

    describe('while the list loads', () => {
        // The screen goes up before the request, so the previous one does not stay
        // frozen in front while it is out.
        it('is already on screen', async () => {
            harness = await startTutorial()
            const held = holdCalls(TutorialService.INSTANCE, 'fetchTodos')

            try {
                const opening = harness.scope.onOpenTodos()
                await vi.waitFor(() => expect(harness?.scope.body).toBeInstanceOf(TodoMvcScope))
                expect(held.calls.length).toEqual(1)

                held.releaseAll()
                await opening
                await harness.settle()
                expect(titles(harness).length).toEqual(5)
            } finally {
                held.restore()
            }
        })
    })

    describe('stress mode, on the place already on screen', () => {
        // Switching mode changes this screen's own state and republishes the address.
        // Flipping to the place already on screen would redo the composition for nothing.
        it('switches without flipping to itself', async () => {
            harness = await startTutorial('/todos')
            const flips = vi.spyOn(MainPresenter.prototype, 'flipToIntent')

            try {
                await todos(harness).actions.onToggleStress()
                await harness.settle()

                expect(flips).not.toHaveBeenCalled()
                expect(todos(harness).main?.items.length).toEqual(1000)
                expect(harness.history.token).toEqual('/todos?tm-uid=-1')
            } finally {
                flips.mockRestore()
            }
        })

        // Regression. Leaving stress mode stopped the clock but kept its handle, so
        // coming back in found a handle and never started it again.
        it('restarts the clock on the way back in', async () => {
            harness = await startTutorial('/todos')
            const timers = vi.spyOn(globalThis, 'setInterval')

            try {
                await todos(harness).actions.onToggleStress()
                await harness.settle()
                await todos(harness).actions.onToggleStress()
                await harness.settle()
                await todos(harness).actions.onToggleStress()
                await harness.settle()

                expect(timers).toHaveBeenCalledTimes(2)
            } finally {
                timers.mockRestore()
            }
        })
    })
})
