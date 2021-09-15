import React from 'react'
import clsx from 'clsx'
import Css from './TodoMvc.module.css'
import { bindUpdate, IViewProps } from 'wdc-cube-react'
import { FooterScope, ShowingOptions } from './TodoMvc.presenter'

export const FooterView = function ({ className, style, scope }: IViewProps & { scope: FooterScope }) {
    const { actions } = scope
    bindUpdate(React, scope)

    let clearButton = <></>

    if (scope.clearButtonVisible) {
        clearButton = <button
            className={Css['clear-completed']}
            onClick={actions.onClearCompleted}>
            Clear completed
        </button>
    }

    console.log('v-footer')

    return <footer className={clsx(className, Css.footer)} style={style}>
        <span className={Css['todo-count']}>
            <strong>{scope.count}</strong> {scope.activeTodoWord} left
        </span>
        <ul className={Css.filters}>
            <li>
                <a
                    className={clsx(scope.showing == ShowingOptions.ALL ? Css.selected : undefined)}
                    onClick={actions.onShowAll}
                >
                    All
                </a>
            </li>
            {' '}
            <li>
                <a
                    className={clsx(scope.showing == ShowingOptions.ACTIVE ? Css.selected : undefined)}
                    onClick={actions.onShowActives}>
                    Active
                </a>
            </li>
            {' '}
            <li>
                <a
                    className={clsx(scope.showing == ShowingOptions.COMPLETED ? Css.selected : undefined)}
                    onClick={actions.onShowCompleteds}>
                    Completed
                </a>
            </li>
        </ul>
        {clearButton}
    </footer>
}