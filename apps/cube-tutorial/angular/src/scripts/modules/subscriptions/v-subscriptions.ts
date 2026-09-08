import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { MatCardModule } from '@angular/material/card'
import { MatListModule } from '@angular/material/list'
import { bindScope } from 'wdc-cube-angular'
import { SubscriptionsScope } from 'wdc-cube-tutorial-app/subscriptions'

@Component({
    selector: 'v-subscriptions',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatCardModule, MatListModule],
    styleUrl: './subscriptions.scss',
    template: `
        <mat-card class="subscriptions-view" appearance="outlined">
            <mat-card-content>
                <h1>Sites you can subscribe to...</h1>
                <mat-action-list aria-label="Sites you can subscribe to">
                    @for (item of scope().sites; track item.id) {
                        <button mat-list-item (click)="scope().onItemClicked(item)">{{ item.site }}</button>
                    }
                </mat-action-list>
            </mat-card-content>
        </mat-card>
    `
})
export class SubscriptionsView {
    readonly scope = input.required<SubscriptionsScope>()

    constructor() {
        bindScope(this.scope)
    }
}
