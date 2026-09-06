import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { bindScope } from 'wdc-cube-angular'
import { AlertScope } from 'wdc-cube-tutorial-core/main'

@Component({
    selector: 'v-alert',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './main.scss',
    template: `
        <div class="alert alert-{{ scope().severity }}" role="alert">
            <strong class="alert-title">{{ scope().title }}</strong>
            <p>{{ scope().message }}</p>
        </div>
        <div class="dialog-actions">
            <button type="button" (click)="scope().onClose()">Close</button>
        </div>
    `
})
export class AlertView {
    readonly scope = input.required<AlertScope>()

    constructor() {
        bindScope(this.scope)
    }
}
