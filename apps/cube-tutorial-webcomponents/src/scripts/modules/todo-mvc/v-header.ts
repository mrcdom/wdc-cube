import { CubeElement, Dom } from 'wdc-cube-webcomponents'
import { HeaderScope } from 'wdc-cube-tutorial-core/todo-mvc'

export class HeaderView extends CubeElement<HeaderScope> {
    private toggleAll!: HTMLInputElement
    private toggleLabel!: HTMLLabelElement
    private field!: HTMLInputElement

    protected declare(dom: Dom): void {
        dom.header((header) => {
            header.className = 'header-input-pane'

            const id = `toggle-all-${Math.random().toString(36).slice(2, 8)}`

            this.toggleAll = dom.input((input) => {
                input.id = id
                input.className = 'toggle-all'
                input.type = 'checkbox'
                input.addEventListener('change', () =>
                    this.safeAction('onToggleAll', () => this.scope.actions.onToggleAll())
                )
            })

            this.toggleLabel = dom.label((label) => {
                label.htmlFor = id
                label.textContent = 'Mark all as complete'
            })

            this.field = dom.input((input) => {
                input.className = 'new-todo'
                input.placeholder = 'What needs to be done?'
                input.autofocus = true
                input.addEventListener('input', () =>
                    this.safeAction('onSyncInputChange', () => this.scope.actions.onSyncInputChange(input.value))
                )
                input.addEventListener('keydown', (event) =>
                    this.safeAction('onSyncInputKeyDown', () => this.scope.actions.onSyncInputKeyDown(event))
                )
            })
        })
    }

    protected override onUpdate(): void {
        this.toggleAll.checked = !this.scope.allItemsCompleted
        this.toggleLabel.style.opacity = this.scope.toggleButtonVisible ? '1' : '0'
        // Only when the two disagree, so a redraw never interrupts typing.
        this.setValue(this.field, this.scope.inputValue)
    }
}
