import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import type { AlertSeverity } from 'wdc-cube'
import { bindScope } from 'wdc-cube-angular'
import { BodyScope } from 'wdc-cube-tutorial-presentation/main'

@Component({
    selector: 'v-body',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatButtonModule, MatCardModule],
    styleUrl: './main.scss',
    template: `
        <mat-card class="body-view" appearance="outlined">
            <mat-card-content>
                <h3>Alert examples</h3>
                <div class="button-pane">
                    @for (severity of severities; track severity) {
                        <button mat-stroked-button (click)="scope().onOpenAlert(severity)">{{ severity }}</button>
                    }
                </div>
            </mat-card-content>
        </mat-card>
    `
})
export class BodyView {
    readonly scope = input.required<BodyScope>()

    readonly severities: AlertSeverity[] = ['info', 'success', 'warning', 'error']

    constructor() {
        bindScope(this.scope)
    }
}
