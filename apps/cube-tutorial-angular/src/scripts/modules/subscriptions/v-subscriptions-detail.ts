import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { bindScope } from 'wdc-cube-angular'
import { SubscriptionsDetailScope } from 'wdc-cube-tutorial-core/subscriptions'

@Component({
    selector: 'v-subscriptions-detail',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatButtonModule, MatFormFieldModule, MatInputModule],
    styleUrl: './subscriptions.scss',
    template: `
        <h2 class="dialog-title">Subscribe</h2>
        <div class="dialog-content">
            <p>
                To subscribe to this website({{ scope().site }}), please enter your email address here. We will send
                updates occasionally.
            </p>
            <mat-form-field appearance="outline" class="email-field">
                <mat-label>Email Address</mat-label>
                <input matInput type="email" (input)="onEmailChanged($event)" />
            </mat-form-field>
        </div>
        <div class="dialog-actions">
            <button mat-button (click)="scope().onClose()">Cancel</button>
            <button mat-button (click)="scope().onSubscribe()">Subscribe</button>
        </div>
    `
})
export class SubscriptionsDetailView {
    readonly scope = input.required<SubscriptionsDetailScope>()

    constructor() {
        bindScope(this.scope)
    }

    onEmailChanged(event: Event) {
        this.scope().onEmailChanged((event.target as HTMLInputElement).value)
    }
}
