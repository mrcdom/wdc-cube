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
        ui = new Rendered().render(<AlertView scope={anAlert()} />)

        expect(ui.text('.MuiAlertTitle-root')).toEqual('Some title')
        expect(ui.text()).toContain('Some message')
    })

    it('carries the severity through to the component that colours it', () => {
        for (const severity of ['info', 'success', 'warning', 'error'] as AlertSeverity[]) {
            ui?.unmount()
            ui = new Rendered().render(<AlertView scope={anAlert(severity)} />)

            expect(ui.get('.MuiAlert-root').classList).toContain(`MuiAlert-color${capitalize(severity)}`)
        }
    })

    it('closes on the button', () => {
        const scope = anAlert()
        ui = new Rendered().render(<AlertView scope={scope} />)

        ui.click('button')

        expect(scope.onClose).toHaveBeenCalledOnce()
    })

    it('redraws when the scope says so', () => {
        const scope = anAlert()
        ui = new Rendered().render(<AlertView scope={scope} />)

        ui.act(() => {
            scope.title = 'Another title'
            scope.forceUpdate()
        })

        expect(ui.text('.MuiAlertTitle-root')).toEqual('Another title')
    })
})

function capitalize(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1)
}
