import { afterEach, describe, expect, it, vi } from 'vitest'
import { Scope } from 'wdc-cube'
import { ViewFactory } from 'wdc-cube-solid'
import { MainScope } from 'wdc-cube-tutorial-presentation/main'

import { Rendered } from '../../../test/render'
import { MainView } from './v-main'

let ui: Rendered | undefined
let opener: HTMLButtonElement | undefined

afterEach(() => {
    ui?.unmount()
    ui = undefined
    opener?.remove()
    opener = undefined
})

/** Something for a slot to draw, so the test is about the layer and not the view in it. */
class ProbeScope extends Scope {
    onClose = Scope.ASYNC_ACTION
}

ViewFactory.register(ProbeScope, () => <button type="button">inside the dialog</button>)

function aShell() {
    const scope = new MainScope()
    scope.onHome = vi.fn()
    scope.onOpenTodos = vi.fn()
    scope.onOpenSuscriptions = vi.fn()
    scope.onLogin = vi.fn()
    return scope
}

/**
 * Waits for Kobalte to finish moving the focus.
 *
 * Not the renderer: a signal write has already reached the DOM by the time it
 * returns. Kobalte defers focus by a task, and measuring said so — synchronously
 * after opening, the focus is still on whatever it was, which made an earlier
 * version of the restore test below pass without the focus ever having moved.
 */
const focusSettled = () => new Promise((resolve) => setTimeout(resolve, 0))

/** A control on the page, focused, standing in for whatever the reader clicked. */
function somethingFocused() {
    const button = document.createElement('button')
    button.textContent = 'opened it'
    document.body.appendChild(button)
    button.focus()
    return button
}

describe('MainView', () => {
    it('opens a layer when the scope is given a dialog, and closes it when it is taken away', () => {
        const scope = aShell()
        ui = new Rendered().render(() => <MainView scope={scope} />)

        expect(document.querySelector('[role=dialog]')).toBeNull()

        ui.act(() => (scope.dialog = new ProbeScope()))
        expect(document.querySelector('[role=dialog]')).not.toBeNull()

        ui.act(() => (scope.dialog = undefined))
        expect(document.querySelector('[role=dialog]')).toBeNull()
    })

    /**
     * Kobalte gives focus back to the dialog's own `Dialog.Trigger`, and these
     * layers have none — they open because a presenter put a scope in a slot. The
     * layer reads `document.activeElement` in `onOpenAutoFocus`, the one moment
     * before the dialog takes the focus for itself.
     */
    describe('focus', () => {
        it('moves into the dialog when it opens', async () => {
            const scope = aShell()
            opener = somethingFocused()
            ui = new Rendered().render(() => <MainView scope={scope} />)

            ui.act(() => (scope.dialog = new ProbeScope()))
            await focusSettled()

            expect(document.activeElement).not.toBe(opener)
            expect(document.querySelector('[role=dialog]')?.contains(document.activeElement)).toBe(true)
        })

        it('gives it back to whatever opened the dialog', async () => {
            const scope = aShell()
            opener = somethingFocused()
            ui = new Rendered().render(() => <MainView scope={scope} />)

            ui.act(() => (scope.dialog = new ProbeScope()))
            await focusSettled()
            // Only meaningful because the focus really left: the test above is
            // what says so.
            expect(document.activeElement).not.toBe(opener)

            ui.act(() => (scope.dialog = undefined))
            await focusSettled()

            expect(document.activeElement).toBe(opener)
        })

        it('gives it back to the dialog below when a stacked alert closes', async () => {
            const scope = aShell()
            ui = new Rendered().render(() => <MainView scope={scope} />)

            ui.act(() => (scope.dialog = new ProbeScope()))
            await focusSettled()
            const insideTheDialog = document.querySelector<HTMLButtonElement>('[role=dialog] button')
            insideTheDialog?.focus()

            ui.act(() => (scope.alert = new ProbeScope() as MainScope['alert']))
            await focusSettled()
            expect(document.activeElement).not.toBe(insideTheDialog)

            ui.act(() => (scope.alert = undefined))
            await focusSettled()

            // Not the page two layers down: the control the reader was on.
            expect(document.activeElement).toBe(insideTheDialog)
        })

        it('does not chase an opener that the navigation took away', async () => {
            const scope = aShell()
            opener = somethingFocused()
            ui = new Rendered().render(() => <MainView scope={scope} />)

            ui.act(() => (scope.dialog = new ProbeScope()))
            await focusSettled()
            opener.remove()

            expect(() => ui?.act(() => (scope.dialog = undefined))).not.toThrow()
            await focusSettled()
            expect(document.activeElement).toBe(document.body)
        })
    })
})
