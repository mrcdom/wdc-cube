import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { bindScope, CubeViewSlot } from 'wdc-cube-angular'
import { RestrictedScope } from 'wdc-cube-tutorial-core/restricted'

@Component({
    selector: 'v-restricted',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CubeViewSlot],
    styles: `
        .restricted-view {
            display: flex;
            background-color: rgb(255, 0, 242);
        }
    `,
    template: `
        <div class="restricted-view">
            @if (scope().detail) {
                <!-- The slot this presenter offers to a deeper place. Passing
                     scope() here would resolve back to this very view. -->
                <ng-container *cubeViewSlot="scope().detail"></ng-container>
            } @else {
                <p>Nothing is nested under this place yet.</p>
            }
        </div>
    `
})
export class RestrictedView {
    readonly scope = input.required<RestrictedScope>()

    constructor() {
        bindScope(this.scope)
    }
}
