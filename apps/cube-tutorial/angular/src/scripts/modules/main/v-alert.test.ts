import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AlertSeverity } from 'wdc-cube'
import { AlertScope } from 'wdc-cube-tutorial-app/main'

import { renderView, type Rendered } from '../../../test/render'
import { AlertView } from './v-alert'

let ui: Rendered<AlertView> | undefined

afterEach(() => {
    ui?.destroy()
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
        ui = renderView(AlertView, anAlert())

        expect(ui.text('.alert-title')).toEqual('Some title')
        expect(ui.text('p')).toEqual('Some message')
    })

    it('marks the severity, which is what the stylesheet colours', () => {
        for (const severity of ['info', 'success', 'warning', 'error'] as AlertSeverity[]) {
            ui?.destroy()
            ui = renderView(AlertView, anAlert(severity))

            expect(ui.has(`.alert.alert-${severity}`)).toEqual(true)
        }
    })

    it('picks an icon per severity, and a fallback for anything else', () => {
        const icons: Record<string, string> = {
            info: 'info',
            success: 'check_circle',
            warning: 'warning',
            error: 'error'
        }

        for (const [severity, icon] of Object.entries(icons)) {
            ui?.destroy()
            ui = renderView(AlertView, anAlert(severity as AlertSeverity))
            expect(ui.text('mat-icon')).toEqual(icon)
        }

        ui?.destroy()
        ui = renderView(AlertView, anAlert('unheard-of' as AlertSeverity))
        expect(ui.text('mat-icon')).toEqual('info')
    })

    it('announces itself as an alert', () => {
        ui = renderView(AlertView, anAlert())

        expect(ui.get('.alert').getAttribute('role')).toEqual('alert')
    })

    it('closes on the button', () => {
        const scope = anAlert()
        ui = renderView(AlertView, scope)

        ui.click('.dialog-actions button')

        expect(scope.onClose).toHaveBeenCalledOnce()
    })

    it('redraws when the scope says so', () => {
        const scope = anAlert()
        ui = renderView(AlertView, scope)

        ui.act(() => {
            scope.title = 'Another title'
            scope.severity = 'error'
            scope.forceUpdate()
        })

        expect(ui.text('.alert-title')).toEqual('Another title')
        expect(ui.has('.alert.alert-error')).toEqual(true)
    })
})
