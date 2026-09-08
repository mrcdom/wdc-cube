import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AlertSeverity } from 'wdc-cube'
import { AlertScope } from 'wdc-cube-tutorial-presentation/main'

import { Rendered } from '../../../test/render'
import { AlertView } from './v-alert'

let ui: Rendered | undefined

afterEach(() => {
    ui?.unmount()
    ui = undefined
})

function anAlert(severity: AlertSeverity = 'info') {
    const scope = new AlertScope()
    scope.severity = severity
    scope.title = 'Some title'
    scope.message = 'Some message'
    scope.onClose = vi.fn()
    return scope
}

describe('AlertView', () => {
    it('shows the title and the message', () => {
        ui = new Rendered().renderInDialog(() => <AlertView scope={anAlert()} />)

        expect(ui.text('.alertHeading')).toEqual('Some title')
        expect(ui.text('.alertMessage')).toEqual('Some message')
    })

    it('carries the severity through to the class that colours it', () => {
        for (const severity of ['info', 'success', 'warning', 'error'] as AlertSeverity[]) {
            ui?.unmount()
            ui = new Rendered().renderInDialog(() => <AlertView scope={anAlert(severity)} />)

            const expected = `alert${severity.charAt(0).toUpperCase()}${severity.slice(1)}`
            expect(ui.get('.alert').classList).toContain(expected)
        }
    })

    it('closes on the button', () => {
        const scope = anAlert()
        ui = new Rendered().renderInDialog(() => <AlertView scope={scope} />)

        ui.click('.alertActions button')

        expect(scope.onClose).toHaveBeenCalledOnce()
    })

    it('redraws when the scope says so', () => {
        const scope = anAlert()
        ui = new Rendered().renderInDialog(() => <AlertView scope={scope} />)

        ui.act(() => {
            scope.title = 'Another title'
            scope.forceUpdate()
        })

        expect(ui.text('.alertHeading')).toEqual('Another title')
    })

    it('wakes only the expression that reads the field that moved', () => {
        const scope = anAlert()
        ui = new Rendered().renderInDialog(() => <AlertView scope={scope} />)

        const heading = ui.get('.alertHeading')
        const message = ui.get('.alertMessage')

        ui.act(() => (scope.message = 'Another message'))

        // The nodes are the same objects: nothing was rebuilt to change one word.
        expect(ui.get('.alertHeading')).toBe(heading)
        expect(ui.get('.alertMessage')).toBe(message)
        expect(message.textContent).toEqual('Another message')
    })
})
