import React, { useState, useCallback, useRef, KeyboardEvent } from 'react'
import clsx from 'clsx'
import { Logger } from 'wdc-cube'
import { bindUpdate, IViewProps } from 'wdc-cube-react'
import Css from './TodoMvc.module.css'
import { ItemScope } from './TodoMvc.presenter'

const LOG = Logger.get('TodoMvc.ItemView')

type ItemViewProps = IViewProps & { scope: ItemScope }

export function ItemView({ className, style, scope, scope: { actions } }: ItemViewProps) {
    LOG.debug('update')

    bindUpdate(React, scope)

    const editTextField = useRef<HTMLInputElement>(null)
    const [editText, setEditText] = useState(scope.title)

    const getCurrentEditText = useCallback(() => editTextField.current?.value ?? '', [editTextField])

    const onDestroy = useCallback(actions.onDestroy, [actions.onDestroy])
    const onToggle = useCallback(actions.onToggle, [actions.onToggle])
    const onEdit = useCallback(actions.onEdit, [actions.onEdit])
    const onBlur = useCallback(() => actions.onBlur(getCurrentEditText()), [actions.onBlur, getCurrentEditText])
    const onKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => actions.onKeyDown(e.code, getCurrentEditText()), [actions.onKeyDown, getCurrentEditText])
    const onChange = useCallback(() => setEditText(getCurrentEditText()), [setEditText, getCurrentEditText])

    React.useEffect(() => {
        const node = editTextField.current
        if (node) {
            node.focus()
            node.setSelectionRange(node.value.length, node.value.length)
        }
    }, [scope.editing])

    return <li
        className={clsx(className, Css.view, scope.completed ? Css.completed : '', scope.editing ? Css.editing : '')}
        style={style}
    >
        {
            scope.editing
                ? <>
                    <input
                        ref={editTextField}
                        className={Css.edit}
                        value={editText}
                        onBlur={onBlur}
                        onChange={onChange}
                        onKeyDown={onKeyDown}
                    />
                </>
                : <>
                    <input
                        className={Css.toggle}
                        type="checkbox"
                        checked={scope.completed}
                        onChange={onToggle}
                    />
                    <label onDoubleClick={onEdit}>{scope.title}</label>
                    <button className={Css.destroy} onClick={onDestroy} />
                </>
        }
    </li>
}
