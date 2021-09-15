import React from 'react'
import clsx from 'clsx'
import { bindUpdate, IViewProps } from 'wdc-cube-react'
import Css from './TodoMvc.module.css'
import { ItemScope } from './TodoMvc.presenter'

export const ItemViewMemo = React.memo(ItemView, (prevProps, nextProps) => {
    return prevProps.scope.editing === nextProps.scope.editing
        && prevProps.scope.title === nextProps.scope.title
        && prevProps.scope.completed === nextProps.scope.completed
})

export function ItemView({ className, style, scope }: IViewProps & { scope: ItemScope }) {
    bindUpdate(React, scope)

    const { actions } = scope

    const editField = React.useRef<HTMLInputElement>(null)
    const [editText, setEditText] = React.useState(scope.title)

    React.useEffect(() => {
        const node = editField.current
        if (node) {
            node.focus()
            node.setSelectionRange(node.value.length, node.value.length)
        }
    }, [scope.editing])

    let bodyElm = <></>
    if (scope.editing) {
        bodyElm = <>
            <input
                ref={editField}
                className={Css.edit}
                value={editText}
                onBlur={() => actions.onBlur(editText)}
                onChange={e => setEditText(e.target.value)}
                onKeyDown={e => actions.onKeyDown(e.code, editText)}
            />
        </>
    } else {
        bodyElm = <>
            <input
                className={Css.toggle}
                type="checkbox"
                checked={scope.completed}
                onChange={() => actions.onToggle()}
            />
            <label onDoubleClick={() => actions && actions.onEdit()}>{scope.title}</label>
            <button className={Css.destroy} onClick={() => actions && actions.onDestroy()} />
        </>
    }

    //console.log('v-item')

    return <li
        className={clsx(className, Css.view, scope.completed ? Css.completed : '', scope.editing ? Css.editing : '')}
        style={style}
    >
        {bodyElm}
    </li>
}
