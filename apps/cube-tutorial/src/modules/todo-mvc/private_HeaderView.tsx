import React, { useCallback } from 'react'
import clsx from 'clsx'
import { Logger } from 'wdc-cube'
import { bindUpdate, IViewProps } from 'wdc-cube-react'
import Css from './TodoMvc.module.css'
import { HeaderScope } from './TodoMvc.presenter'

const LOG = Logger.get('TodoMvc.HeaderView')

type HeaderViewProps = IViewProps & { scope: HeaderScope }

export const HeaderView = function ({ className, style, scope, scope: { actions } }: HeaderViewProps) {
    LOG.debug('update')

    bindUpdate(React, scope)

    const newField = React.useRef<HTMLInputElement>(null)

    const onToggleAll = useCallback(actions.onToggleAll, [actions.onToggleAll])
    const onNewTodoKeyDown = useCallback(newTodoKeyDown.bind(undefined, actions.onAddTodo, newField), [actions.onAddTodo, newField])

    return <header className={clsx(Css.header, className)} style={style}>
        <div className={Css.headerInputPane}>
            <>
                <input
                    id={scope.uuid}
                    className={Css['toggle-all']}
                    type="checkbox"
                    onChange={onToggleAll}
                    checked={!scope.allItemsCompleted}
                />
                <label htmlFor={scope.uuid} style={{ opacity: scope.toggleButtonVisible ? 1 : 0 }}>
                    Mark all as complete
                </label>
            </>
            <input
                ref={newField}
                className={Css['new-todo']}
                placeholder="What needs to be done?"
                onKeyDown={onNewTodoKeyDown}
                autoFocus={true}
            />
        </div>
    </header>
}

async function newTodoKeyDown(
    onAddTodo: (val: string) => Promise<void>,
    newField: React.RefObject<HTMLInputElement>,
    event: React.KeyboardEvent<HTMLInputElement>
) {
    if (event.code !== 'Enter') {
        return
    }

    event.preventDefault()

    if (newField.current) {
        const val = newField.current.value.trim()

        if (val) {
            await onAddTodo(val)

            newField.current.value = ''
        }
    }
}
