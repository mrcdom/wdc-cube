import React, { useRef, useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import clsx from 'clsx'
import { Logger } from 'wdc-cube'
import { bindUpdate, IViewProps } from 'wdc-cube-react'
import Css from './TodoMvc.module.css'
import { HeaderScope } from '../TodoMvc.scopes'

const LOG = Logger.get('TodoMvc.HeaderView')

type HeaderViewProps = IViewProps & { scope: HeaderScope }

export const HeaderView = function ({ className, style, scope, scope: { actions } }: HeaderViewProps) {
    LOG.debug('update')

    bindUpdate(React, scope)

    const inputField = useRef<HTMLInputElement>(null)
    const [inputUuid] = useState(uuidv4)
    const getCurrentFieldText = useCallback(() => inputField.current?.value ?? '', [inputField])

    // Actions
    const onChange = useCallback(() => actions.onSyncInputChange(getCurrentFieldText()), [actions.onSyncInputChange, getCurrentFieldText])
    const onInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => actions.onSyncInputKeyDown(e), [actions.onSyncInputKeyDown])
    const onToggleAll = useCallback(() => actions.onToggleAll(), [actions.onToggleAll])

    // Render
    return <header className={clsx(Css.header, className)} style={style}>
        <div className={Css.headerInputPane}>
            <>
                <input
                    id={inputUuid}
                    className={Css['toggle-all']}
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
                className={Css['new-todo']}
                placeholder="What needs to be done?"
                onKeyDown={onInputKeyDown}
                autoFocus={true}
                onChange={onChange}
                value={scope.inputValue}
            />
        </div>
    </header>
}