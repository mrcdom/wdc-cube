import { CubeElement, Dom } from 'wdc-cube-webcomponents'
import { ItemScope } from 'wdc-cube-tutorial-core/todo-mvc'

import Css from './todo-mvc.module.scss'

/** One todo row. A row is an element like any other, which is what makes syncList trivial. */
export class ItemView extends CubeElement<ItemScope> {
    private row!: HTMLLIElement
    private toggle!: HTMLInputElement
    private titleLabel!: HTMLLabelElement
    private editor!: HTMLInputElement

    protected declare(dom: Dom): void {
        this.row = dom.li((li) => {
            li.className = Css.view

            this.toggle = dom.input((input) => {
                input.className = Css.toggle
                input.type = 'checkbox'
                input.addEventListener('change', () => this.safeAction('onToggle', () => this.scope.actions.onToggle()))
            })

            this.titleLabel = dom.label((label) => {
                label.addEventListener('dblclick', () => this.safeAction('onEdit', () => this.scope.actions.onEdit()))
            })

            dom.button((button) => {
                button.className = Css.destroy
                button.addEventListener('click', () =>
                    this.safeAction('onDestroy', () => this.scope.actions.onDestroy())
                )
            })

            this.editor = dom.input((input) => {
                input.className = Css.edit
                input.addEventListener('blur', () =>
                    this.safeAction('onBlur', () => this.scope.actions.onBlur(() => input.value))
                )
                input.addEventListener('keydown', (event) =>
                    this.safeAction('onKeyDown', () => this.scope.actions.onKeyDown(() => input.value, event))
                )
            })
        })
    }

    protected override onUpdate(): void {
        const scope = this.scope

        this.setClass(this.row, Css.completed, scope.completed)
        this.setClass(this.row, Css.editing, scope.editing)
        this.setChecked(this.toggle, scope.completed)
        this.setText(this.titleLabel, scope.title)

        if (scope.editing) {
            // Only on the way in: writing on every redraw would move the caret
            // while somebody is typing.
            if (document.activeElement !== this.editor) {
                this.editor.value = scope.title
                this.editor.focus()
                this.editor.setSelectionRange(scope.title.length, scope.title.length)
            }
        }
    }
}
