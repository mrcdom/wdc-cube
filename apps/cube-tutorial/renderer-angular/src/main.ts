import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core'
import { MatIconRegistry } from '@angular/material/icon'
import { bootstrapApplication } from '@angular/platform-browser'
import { PageHistoryManager } from 'wdc-cube'
import { bindScope, CubeViewSlot } from 'wdc-cube-angular'
import { initializeRoutes, registerServices } from 'wdc-cube-tutorial-presentation'
import { MainPresenter } from 'wdc-cube-tutorial-presentation/main'

import { registerAllViews } from './scripts/modules/ViewCatalog'

registerServices()
registerAllViews()
initializeRoutes()

@Component({
    selector: 'app-root',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CubeViewSlot],
    template: `<ng-container *cubeViewSlot="rootScope()"></ng-container>`
})
export class AppRoot {
    readonly presenter = new MainPresenter(new PageHistoryManager(true))

    // The root scope never changes, but bindScope takes a signal so it can follow
    // one that does — which is what every other view passes it.
    readonly rootScope = signal(this.presenter.scope)

    constructor() {
        // index.html loads Material Symbols; mat-icon defaults to the older
        // Material Icons font, and without this the ligature renders as text.
        inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined')

        // The root scope has no parent slot to bind it, so the shell does it.
        bindScope(this.rootScope)

        const release = this.presenter.initialize()
        inject(DestroyRef).onDestroy(release)
    }
}

bootstrapApplication(AppRoot).catch((caught) => console.error(caught))
