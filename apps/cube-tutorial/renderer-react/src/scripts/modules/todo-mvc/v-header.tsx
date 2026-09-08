import React from 'react'
import clsx from 'clsx'
import { Logger } from 'wdc-cube'
import { classToFComponent, FCClass, CubeRefObject, type IViewProps } from 'wdc-cube-react'
import Css from './todo-mvc.module.scss'
import { HeaderScope } from 'wdc-cube-tutorial-presentation/todo-mvc'

const LOG = Logger.get('TodoMvc.HeaderView')

let nextInputId = 0

type HeaderViewProps = IViewProps & { scope: HeaderScope }

class HeaderViewClass extends FCClass<HeaderViewProps> {
    private readonly inputField = new CubeRefObject<HTMLInputElement>()
    private readonly inputId = `todo-toggle-all-${nextInputId++}`

    private getCurrentFieldText() {
        return this.inputField.current?.value ?? ''
    }

    private readonly onChange = () => this.scope.actions.onSyncInputChange(this.getCurrentFieldText())

    private readonly onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) =>
        this.scope.actions.onSyncInputKeyDown(e)

    private readonly onToggleAll = () => this.scope.actions.onToggleAll()

    // The field is UNCONTROLLED on purpose. Scopes update the view
    // asynchronously (CallbackManager, ~16ms), while React restores the value of
    // controlled inputs at the end of every event — which would erase each
    // keystroke before the scope caught up. Here the DOM leads while typing and
    // the scope mirrors it; this hook only pushes into the DOM when the presenter
    // is the one changing it, such as clearing the field on Enter or Escape.
    onAfterRender() {
        const node = this.inputField.current
        if (node && node.value !== this.scope.inputValue) {
            node.value = this.scope.inputValue
        }
    }

    render({ className, style }: HeaderViewProps) {
        LOG.debug('update')

        const scope = this.scope

        return (
            <header className={clsx(className)} style={style}>
                <div className={Css.headerInputPane}>
                    <input
                        id={this.inputId}
                        className={Css.toggleAll}
                        type="checkbox"
                        onChange={this.onToggleAll}
                        checked={!scope.allItemsCompleted}
                    />
                    <label htmlFor={this.inputId} style={{ opacity: scope.toggleButtonVisible ? 1 : 0 }}>
                        Mark all as complete
                    </label>
                    <input
                        ref={this.inputField}
                        className={Css.newTodo}
                        placeholder="What needs to be done?"
                        onKeyDown={this.onInputKeyDown}
                        autoFocus={true}
                        onChange={this.onChange}
                        defaultValue={scope.inputValue}
                    />
                </div>
            </header>
        )
    }
}

export const HeaderView = classToFComponent(HeaderViewClass)
