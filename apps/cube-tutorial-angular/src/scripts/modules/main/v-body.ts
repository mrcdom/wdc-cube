import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import type { AlertSeverity } from 'wdc-cube'
import { bindScope } from 'wdc-cube-angular'
import { BodyScope } from 'wdc-cube-tutorial-core/main'

@Component({
    selector: 'v-body',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './main.scss',
    template: `
        <div class="body-view">
            <h3>Alert examples</h3>
            <div class="button-pane">
                @for (severity of severities; track severity) {
                    <button type="button" (click)="scope().onOpenAlert(severity)">{{ severity }}</button>
                }
            </div>
        </div>
    `
})
export class BodyView {
    readonly scope = input.required<BodyScope>()

    readonly severities: AlertSeverity[] = ['info', 'success', 'warning', 'error']

    constructor() {
        bindScope(this.scope)
    }
}
