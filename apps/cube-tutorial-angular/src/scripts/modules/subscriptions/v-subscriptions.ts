import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { bindScope } from 'wdc-cube-angular'
import { SubscriptionsScope } from 'wdc-cube-tutorial-core/subscriptions'

@Component({
    selector: 'v-subscriptions',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './subscriptions.scss',
    template: `
        <div class="subscriptions-view">
            <h1>Sites you can subscribe to...</h1>
            <nav aria-label="main mailbox folders">
                <ul>
                    @for (item of scope().sites; track item.id) {
                        <li>
                            <button type="button" (click)="scope().onItemClicked(item)">{{ item.site }}</button>
                        </li>
                    }
                </ul>
            </nav>
        </div>
    `
})
export class SubscriptionsView {
    readonly scope = input.required<SubscriptionsScope>()

    constructor() {
        bindScope(this.scope)
    }
}
