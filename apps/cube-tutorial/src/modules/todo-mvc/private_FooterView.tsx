import React from 'react'
import clsx from 'clsx'
import Css from './TodoMvc.module.css'
import { bindUpdate } from 'wdc-cube-react'
import { FooterScope, ShowingTodos } from './TodoMvcPresenter'

type FooterViewProps = {
    className?: string
    style?: React.CSSProperties
    scope: FooterScope
}

export function FooterView({ scope, className, style }: FooterViewProps) {
    bindUpdate(React, scope)

    let clearButton = <></>

    if (scope.clearButtonVisible) {
        clearButton = <button
            className={Css['clear-completed']}
            onClick={scope.onClearCompleted}>
            Clear completed
        </button>
    }

    return <footer className={clsx(className, Css.footer)} style={style}>
        <span className={Css['todo-count']}>
            <strong>{scope.count}</strong> {scope.activeTodoWord} left
        </span>
        <ul className={Css.filters}>
            <li>
                <a
                    className={clsx(scope.showing == ShowingTodos.ALL ? Css.selected : undefined)}
                    onClick={scope.onShowAll}
                    >
                    All
                </a>
            </li>
            {' '}
            <li>
                <a
                    className={clsx(scope.showing == ShowingTodos.ACTIVE ? Css.selected : undefined)}
                    onClick={scope.onShowActives}>
                    Active
                </a>
            </li>
            {' '}
            <li>
                <a
                    className={clsx(scope.showing == ShowingTodos.COMPLETED ? Css.selected : undefined)}
                    onClick={scope.onShowCompleteds}>
                    Completed
                </a>
            </li>
        </ul>
        {clearButton}
    </footer>
}