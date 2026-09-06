import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { bindScope, CubeViewSlot } from 'wdc-cube-angular'
import { MainScope } from 'wdc-cube-tutorial-core/main'

@Component({
    selector: 'v-main',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CubeViewSlot],
    styleUrl: './main.scss',
    template: `
        <div class="main-view">
            <header class="app-bar">
                <button type="button" class="menu-button" aria-label="menu">☰</button>
                <h6 class="app-bar-title">Cube Framework (Tutorial Example)</h6>
                <button type="button" (click)="scope().onHome()">Home</button>
                <button type="button" (click)="scope().onOpenTodos()">Todos</button>
                <button type="button" (click)="scope().onOpenSuscriptions()">Subscriptions</button>
                <button type="button" (click)="scope().onLogin()">Login</button>
            </header>

            <div class="body">
                <ng-container *cubeViewSlot="scope().body"></ng-container>
            </div>

            @if (scope().dialog) {
                <div class="backdrop" (click)="scope().dialog?.onClose()"></div>
                <div class="dialog" role="dialog">
                    <ng-container *cubeViewSlot="scope().dialog"></ng-container>
                </div>
            }

            @if (scope().alert) {
                <div class="backdrop" (click)="scope().alert?.onClose()"></div>
                <div class="dialog" role="dialog">
                    <ng-container *cubeViewSlot="scope().alert"></ng-container>
                </div>
            }
        </div>
    `
})
export class MainView {
    readonly scope = input.required<MainScope>()

    constructor() {
        bindScope(this.scope)
    }
}
