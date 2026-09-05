import React from 'react'
import clsx from 'clsx'
import { Logger } from 'wdc-cube'
import { classToFComponent, CubeRefObject, type FCClassContext, type IViewProps } from 'wdc-cube-react'
import Css from './todo-mvc.module.scss'
import { HeaderScope } from '../todo-mvc.scope'

const LOG = Logger.get('TodoMvc.HeaderView')

let nextInputId = 0

type HeaderViewProps = IViewProps & { scope: HeaderScope }

class HeaderViewClass implements FCClassContext<HeaderViewProps> {
    scope!: HeaderScope

    private readonly inputField = new CubeRefObject<HTMLInputElement>()
    private readonly inputId = `todo-toggle-all-${nextInputId++}`

    private getCurrentFieldText() {
        return this.inputField.current?.value ?? ''
    }

    private readonly onChange = () => this.scope.actions.onSyncInputChange(this.getCurrentFieldText())

    private readonly onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) =>
        this.scope.actions.onSyncInputKeyDown(e)

    private readonly onToggleAll = () => this.scope.actions.onToggleAll()

    // O campo e NAO-controlado de proposito. O escopo atualiza a view de forma
    // assincrona (CallbackManager, ~16ms), enquanto o React restaura o valor de
    // inputs controlados ao fim de cada evento — o que apagaria cada tecla antes
    // do escopo chegar. Aqui o DOM manda enquanto se digita, o escopo espelha,
    // e este gancho so empurra para o DOM quando quem mudou foi o presenter
    // (por exemplo ao limpar o campo no Enter/Escape).
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

export const HeaderView = classToFComponent<HeaderViewProps>(HeaderViewClass)
