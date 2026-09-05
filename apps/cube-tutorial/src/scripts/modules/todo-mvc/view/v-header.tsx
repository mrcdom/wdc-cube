import React, { useRef, useId, useCallback } from 'react'
import clsx from 'clsx'
import { Logger } from 'wdc-cube'
import { bindUpdate, IViewProps } from 'wdc-cube-react'
import Css from './todo-mvc.module.scss'
import { HeaderScope } from '../todo-mvc.scope'

const LOG = Logger.get('TodoMvc.HeaderView')

type HeaderViewProps = IViewProps & { scope: HeaderScope }

export const HeaderView = function ({ className, style, scope, scope: { actions } }: HeaderViewProps) {
    LOG.debug('update')

    bindUpdate(React, scope)

    const inputField = useRef<HTMLInputElement>(null)
    const inputUuid = useId()
    const getCurrentFieldText = useCallback(() => inputField.current?.value ?? '', [inputField])

    // O campo e NAO-controlado de proposito. O escopo atualiza a view de forma
    // assincrona (CallbackManager, ~16ms), enquanto o React restaura o valor de
    // inputs controlados ao fim de cada evento — o que apagaria cada tecla antes
    // do escopo chegar. Aqui o DOM manda enquanto se digita, o escopo espelha,
    // e este efeito so empurra para o DOM quando quem mudou foi o presenter
    // (por exemplo ao limpar o campo no Enter/Escape).
    React.useEffect(() => {
        const node = inputField.current
        if (node && node.value !== scope.inputValue) {
            node.value = scope.inputValue
        }
    })

    // Actions
    const onChange = useCallback(
        () => actions.onSyncInputChange(getCurrentFieldText()),
        [actions.onSyncInputChange, getCurrentFieldText]
    )
    const onInputKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => actions.onSyncInputKeyDown(e),
        [actions.onSyncInputKeyDown]
    )
    const onToggleAll = useCallback(() => actions.onToggleAll(), [actions.onToggleAll])

    // Render
    return (
        <header className={clsx(Css.header, className)} style={style}>
            <div className={Css.headerInputPane}>
                <>
                    <input
                        id={inputUuid}
                        className={Css.toggleAll}
                        type="checkbox"
                        onChange={onToggleAll}
                        checked={!scope.allItemsCompleted}
                    />
                    <label htmlFor={inputUuid} style={{ opacity: scope.toggleButtonVisible ? 1 : 0 }}>
                        Mark all as complete
                    </label>
                </>
                <input
                    ref={inputField}
                    className={Css.newTodo}
                    placeholder="What needs to be done?"
                    onKeyDown={onInputKeyDown}
                    autoFocus={true}
                    onChange={onChange}
                    defaultValue={scope.inputValue}
                />
            </div>
        </header>
    )
}
