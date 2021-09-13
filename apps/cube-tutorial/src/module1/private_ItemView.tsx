import React from 'react'
import clsx from 'clsx'
import { bindUpdate } from 'wdc-cube-react'
import Css from './TodoMvc.module.css'
import { ItemScope } from './TodoMvcPresenter'

type ItemViewProps = {
    className?: string
    style?: React.CSSProperties
    scope: ItemScope
}

export function ItemView({ scope, className, style }: ItemViewProps) {
    bindUpdate(React, scope)

    const editField = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
        scope.focus = false
        if (editField.current) {
            editField.current.focus()
        }
    }, [scope.focus])

    let bodyElm = <></>
    if (scope.editing) {
        bodyElm = <>
            <input
                ref={editField}
                className={Css.edit}
                value={scope.editText}
                onBlur={scope.onBlur}
                onChange={e => scope.onChange(e.target.value)}
                onKeyDown={e => scope.onKeyDown(e.code)}
            />
        </>
    } else {
        bodyElm = <>
            <input
                className={Css.toggle}
                type="checkbox"
                checked={scope.completed}
                onChange={scope.onToggle}
            />
            <label onDoubleClick={scope.onEdit}>{scope.title}</label>
            <button className={Css.destroy} onClick={scope.onDestroy} />
        </>
    }

    return <li
        className={clsx(className, Css.view, scope.completed ? Css.complete : '', scope.editing ? Css.editing : '')}
        style={style}
    >
        {bodyElm}
    </li>
}