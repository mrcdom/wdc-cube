import { ChangeDetectionStrategy, Component, ElementRef, effect, input, viewChild } from '@angular/core'
import { bindScope } from 'wdc-cube-angular'
import { ItemScope } from 'wdc-cube-tutorial-presentation/todo-mvc'

@Component({
    selector: 'v-item',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <li class="view" [class.completed]="scope().completed" [class.editing]="scope().editing">
            @if (scope().editing) {
                <input
                    #editField
                    class="edit"
                    [value]="scope().title"
                    (blur)="onBlur()"
                    (keydown)="onKeyDown($event)"
                />
            } @else {
                <input
                    class="toggle"
                    type="checkbox"
                    [checked]="scope().completed"
                    (change)="scope().actions.onToggle()"
                />
                <label (dblclick)="scope().actions.onEdit()">{{ scope().title }}</label>
                <button type="button" class="destroy" (click)="scope().actions.onDestroy()"></button>
            }
        </li>
    `
})
export class ItemView {
    readonly scope = input.required<ItemScope>()

    private readonly editField = viewChild<ElementRef<HTMLInputElement>>('editField')

    constructor() {
        bindScope(this.scope)

        // viewChild is a signal, so this runs exactly when the edit field enters
        // the DOM — the same job the React view gives a ref callback.
        effect(() => {
            const node = this.editField()?.nativeElement
            if (node) {
                node.focus()
                node.setSelectionRange(node.value.length, node.value.length)
            }
        })
    }

    private readonly currentEditText = () => this.editField()?.nativeElement.value ?? ''

    onBlur() {
        this.scope().actions.onBlur(this.currentEditText)
    }

    onKeyDown(event: KeyboardEvent) {
        this.scope().actions.onKeyDown(this.currentEditText, event)
    }
}
