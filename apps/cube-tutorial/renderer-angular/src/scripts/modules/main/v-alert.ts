import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { bindScope } from 'wdc-cube-angular'
import { AlertScope } from 'wdc-cube-tutorial-presentation/main'

const ICONS: Record<string, string> = {
    info: 'info',
    success: 'check_circle',
    warning: 'warning',
    error: 'error'
}

@Component({
    selector: 'v-alert',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatButtonModule, MatIconModule],
    styleUrl: './main.scss',
    template: `
        <!-- Material has no Alert component; MUI's is a Material Design pattern
             rather than a spec component, so this is built from the theme's own
             tokens to sit alongside the rest. -->
        <div class="alert alert-{{ scope().severity }}" role="alert">
            <mat-icon>{{ icon() }}</mat-icon>
            <div>
                <strong class="alert-title">{{ scope().title }}</strong>
                <p>{{ scope().message }}</p>
            </div>
        </div>
        <div class="dialog-actions">
            <button mat-button (click)="scope().onClose()">Close</button>
        </div>
    `
})
export class AlertView {
    readonly scope = input.required<AlertScope>()

    constructor() {
        bindScope(this.scope)
    }

    icon() {
        return ICONS[this.scope().severity] ?? 'info'
    }
}
