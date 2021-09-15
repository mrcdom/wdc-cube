import React from 'react'
import clsx from 'clsx'
import { bindUpdate, IViewProps } from 'wdc-cube-react'
import Css from './TodoMvc.module.css'
import { HeaderScope } from './TodoMvc.presenter'

export const HeaderView = function ({ className, style, scope }: IViewProps & { scope: HeaderScope }) {
    bindUpdate(React, scope)

    const newField = React.useRef<HTMLInputElement>(null)

    console.log('v-header')

    return <header className={clsx(Css.header, className)} style={style}>
        <div className={Css.headerInputPane}>
            <>
                <input
                    id={scope.uuid}
                    className={Css['toggle-all']}
                    type="checkbox"
                    onChange={scope.onToggleAll}
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
                onKeyDown={e => handleNewTodoKeyDown(scope, e, newField)}
                autoFocus={true}
            />
        </div>
    </header>
}

function handleNewTodoKeyDown(scope: Partial<HeaderScope>, event: React.KeyboardEvent<HTMLInputElement>, newField: React.RefObject<HTMLInputElement>) {
    if (event.code !== 'Enter') {
        return
    }

    event.preventDefault()

    if (newField.current) {
        const val = newField.current.value.trim()

        if (val) {
            if (scope.onAddTodo) {
                scope.onAddTodo(val)
            }
            newField.current.value = ''
        }
    }
}