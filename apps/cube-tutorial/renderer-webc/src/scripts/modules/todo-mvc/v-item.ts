import { ItemScope } from 'wdc-cube-tutorial-presentation/todo-mvc'

import { AppElement, type AppDom } from '../../widgets'

import Css from './todo-mvc.module.scss'

/** One todo row. A row is an element like any other, which is what makes syncList trivial. */
export class ItemView extends AppElement<ItemScope> {
    private row!: HTMLLIElement
    private toggle!: HTMLInputElement
    private titleLabel!: HTMLLabelElement
    private editor!: HTMLInputElement

    private readonly onToggle = this.action('onToggle', () => this.scope.actions.onToggle())
    private readonly onEdit = this.action('onEdit', () => this.scope.actions.onEdit())
    private readonly onDestroy = this.action('onDestroy', () => this.scope.actions.onDestroy())
    private readonly onBlur = this.action('onBlur', () => this.scope.actions.onBlur(() => this.editor.value))
    private readonly onKeyDown = this.action('onKeyDown', (event: KeyboardEvent) =>
        this.scope.actions.onKeyDown(() => this.editor.value, event)
    )

    protected declare(dom: AppDom): void {
        this.row = dom.li((li) => {
            li.className = Css.view

            this.toggle = dom.input((input) => {
                input.className = Css.toggle
                input.type = 'checkbox'
                input.addEventListener('change', this.onToggle)
            })

            this.titleLabel = dom.label((label) => {
                label.addEventListener('dblclick', this.onEdit)
            })

            dom.button((button) => {
                button.className = Css.destroy
                button.addEventListener('click', this.onDestroy)
            })

            this.editor = dom.input((input) => {
                input.className = Css.edit
                input.addEventListener('blur', this.onBlur)
                input.addEventListener('keydown', this.onKeyDown)
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
