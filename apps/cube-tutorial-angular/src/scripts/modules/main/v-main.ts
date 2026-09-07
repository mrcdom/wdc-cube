import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatToolbarModule } from '@angular/material/toolbar'
import { bindScope, CubeViewSlot } from 'wdc-cube-angular'
import { MainScope } from 'wdc-cube-tutorial-core/main'

@Component({
    selector: 'v-main',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CubeViewSlot, MatButtonModule, MatIconModule, MatToolbarModule],
    styleUrl: './main.scss',
    template: `
        <div class="main-view">
            <mat-toolbar color="primary">
                <button mat-icon-button aria-label="menu"><mat-icon>menu</mat-icon></button>
                <span class="app-bar-title">Cube Framework (Tutorial Example)</span>
                <button mat-button (click)="scope().onHome()">Home</button>
                <button mat-button (click)="scope().onOpenTodos()">Todos</button>
                <button mat-button (click)="scope().onOpenSuscriptions()">Subscriptions</button>
                <button mat-button (click)="scope().onLogin()">Login</button>
            </mat-toolbar>

            <div class="body">
                <ng-container *cubeViewSlot="scope().body"></ng-container>
            </div>

            @if (scope().dialog) {
                <div class="backdrop" (click)="scope().dialog?.onClose()"></div>
                <div class="dialog mat-elevation-z24" role="dialog">
                    <ng-container *cubeViewSlot="scope().dialog"></ng-container>
                </div>
            }

            @if (scope().alert) {
                <div class="backdrop" (click)="scope().alert?.onClose()"></div>
                <div class="dialog mat-elevation-z24" role="dialog">
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
