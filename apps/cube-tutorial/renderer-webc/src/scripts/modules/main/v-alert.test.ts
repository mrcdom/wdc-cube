import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AlertSeverity } from 'wdc-cube'
import { ViewFactory } from 'wdc-cube-webc'
import { AlertScope } from 'wdc-cube-tutorial-presentation/main'

import { renderView, type Rendered } from '../../../test/render'
import { registerViews } from './index'

registerViews(ViewFactory.define)

let ui: Rendered<AlertScope> | undefined

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
        ui = renderView('v-alert', anAlert())

        expect(ui.text('h2')).toEqual('Some title')
        expect(ui.text('p')).toEqual('Some message')
    })

    /**
     * Spectrum names confirmation, information, warning, error, destructive and
     * secondary, and has no success — which is why `AppAlertDialog` adds one. The
     * mapping is what this asserts, and `success` is the half of it that would
     * not exist without the extension.
     */
    it('maps each severity onto the dialog variant that draws it', () => {
        const expected: Record<AlertSeverity, string> = {
            info: 'information',
            success: 'success',
            warning: 'warning',
            error: 'error'
        }

        for (const [severity, variant] of Object.entries(expected)) {
            ui?.unmount()
            ui = renderView('v-alert', anAlert(severity as AlertSeverity))

            expect(ui.get('app-alert-dialog').getAttribute('variant')).toEqual(variant)
        }
    })

    it('closes on the button', () => {
        const scope = anAlert()
        ui = renderView('v-alert', scope)

        ui.click('app-action-button')

        expect(scope.onClose).toHaveBeenCalledOnce()
    })

    it('redraws when the scope says so', () => {
        const scope = anAlert()
        ui = renderView('v-alert', scope)

        ui.act(() => {
            scope.title = 'Another title'
            scope.severity = 'error'
            scope.forceUpdate()
        })

        expect(ui.text('h2')).toEqual('Another title')
        expect(ui.get('app-alert-dialog').getAttribute('variant')).toEqual('error')
    })

    it('writes over the tree it built rather than building another', () => {
        const scope = anAlert()
        ui = renderView('v-alert', scope)

        const heading = ui.get('h2')
        const message = ui.get('p')

        ui.act(() => {
            scope.message = 'Another message'
            scope.forceUpdate()
        })

        expect(ui.get('h2')).toBe(heading)
        expect(ui.get('p')).toBe(message)
        expect(message.textContent).toEqual('Another message')
    })
})
