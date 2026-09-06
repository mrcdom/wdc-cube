import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { bindScope } from 'wdc-cube-angular'
import { SubscriptionsDetailScope } from 'wdc-cube-tutorial-core/subscriptions'

@Component({
    selector: 'v-subscriptions-detail',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './subscriptions.scss',
    template: `
        <h2 class="dialog-title">Subscribe</h2>
        <div class="dialog-content">
            <p>
                To subscribe to this website({{ scope().email }}), please enter your email address here. We will send
                updates occasionally.
            </p>
            <label>
                Email Address
                <input type="email" (input)="onEmailChanged($event)" />
            </label>
        </div>
        <div class="dialog-actions">
            <button type="button" (click)="scope().onClose()">Cancel</button>
            <button type="button" (click)="scope().onSubscribe()">Subscribe</button>
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
