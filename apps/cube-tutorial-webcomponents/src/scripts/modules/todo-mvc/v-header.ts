import { HeaderScope } from 'wdc-cube-tutorial-core/todo-mvc'

import { AppElement, type AppDom } from '../../widgets'

import Css from './todo-mvc.module.scss'

export class HeaderView extends AppElement<HeaderScope> {
    private toggleAll!: HTMLInputElement
    private toggleLabel!: HTMLLabelElement
    private field!: HTMLInputElement

    protected declare(dom: AppDom): void {
        dom.header((header) => {
            header.className = Css.headerInputPane

            const id = `toggle-all-${Math.random().toString(36).slice(2, 8)}`

            this.toggleAll = dom.input((input) => {
                input.id = id
                input.className = Css.toggleAll
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
                input.className = Css.newTodo
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
        this.setChecked(this.toggleAll, !this.scope.allItemsCompleted)
        // A class rather than an inline style, so the guarded setter covers it.
        this.setClass(this.toggleLabel, Css.hidden, !this.scope.toggleButtonVisible)
        // Only when the two disagree, so a redraw never interrupts typing.
        this.setValue(this.field, this.scope.inputValue)
    }
}
