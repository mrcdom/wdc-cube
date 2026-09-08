import { ChangeDetectionStrategy, Component, ElementRef, afterEveryRender, input, viewChild } from '@angular/core'
import { bindScope } from 'wdc-cube-angular'
import { HeaderScope, type KeyDownEvent } from 'wdc-cube-tutorial-app/todo-mvc'

let nextInputId = 0

@Component({
    selector: 'v-header',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <header>
            <div class="header-input-pane">
                <input
                    [id]="inputId"
                    class="toggle-all"
                    type="checkbox"
                    [checked]="!scope().allItemsCompleted"
                    (change)="scope().actions.onToggleAll()"
                />
                <label [for]="inputId" [style.opacity]="scope().toggleButtonVisible ? 1 : 0">
                    Mark all as complete
                </label>
                <input
                    #field
                    class="new-todo"
                    placeholder="What needs to be done?"
                    autofocus
                    (input)="onChange($event)"
                    (keydown)="scope().actions.onSyncInputKeyDown($event)"
                />
            </div>
        </header>
    `
})
export class HeaderView {
    readonly scope = input.required<HeaderScope>()

    readonly inputId = `todo-toggle-all-${nextInputId++}`

    private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field')

    constructor() {
        bindScope(this.scope)

        // The field is uncontrolled, and this pushes the scope's value into it
        // only when the two disagree — the same shape as the React view's
        // onAfterRender.
        //
        // A [value] binding is not enough. Angular writes to the DOM only when
        // the bound expression changes between checks, but the user writes to
        // the DOM directly, so the two can disagree without Angular noticing:
        // typing and pressing Enter inside one flush window leaves the scope
        // back at '' — the value Angular already believed — and the typed text
        // stays on screen.
        afterEveryRender({
            write: () => {
                const node = this.field().nativeElement
                const value = this.scope().inputValue
                if (node.value !== value) {
                    node.value = value
                }
            }
        })
    }

    onChange(event: Event) {
        this.scope().actions.onSyncInputChange((event.target as HTMLInputElement).value)
    }
}

export type { KeyDownEvent }
