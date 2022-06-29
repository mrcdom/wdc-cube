import React, { useCallback } from 'react'
import clsx from 'clsx'
import { Logger } from 'wdc-cube'
import Css from './TodoMvc.module.css'
import { bindUpdate, IViewProps } from 'wdc-cube-react'
import { FooterScope, ShowingOptions } from '../TodoMvc.scopes'

const LOG = Logger.get('TodoMvc.FooterView')

type FooterViewProps = IViewProps & { scope: FooterScope }

export const FooterView = function ({ className, style, scope, scope: { actions } }: FooterViewProps) {
    LOG.debug('update')

    bindUpdate(React, scope)

    const onClearCompleted = useCallback(actions.onClearCompleted, [actions.onClearCompleted])
    const onShowAll = useCallback(actions.onShowAll, [actions.onShowAll])
    const onShowActives = useCallback(actions.onShowActives, [actions.onShowActives])
    const onShowCompleteds = useCallback(actions.onShowCompleteds, [actions.onShowCompleteds])

    let clearButton = <></>

    if (scope.clearButtonVisible) {
        clearButton = <button
            className={Css['clear-completed']}
            onClick={onClearCompleted}>
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
                    className={clsx(scope.showing == ShowingOptions.ALL ? Css.selected : undefined)}
                    onClick={onShowAll}
                >
                    All
                </a>
            </li>
            {' '}
            <li>
                <a
                    className={clsx(scope.showing == ShowingOptions.ACTIVE ? Css.selected : undefined)}
                    onClick={onShowActives}>
                    Active
                </a>
            </li>
            {' '}
            <li>
                <a
                    className={clsx(scope.showing == ShowingOptions.COMPLETED ? Css.selected : undefined)}
                    onClick={onShowCompleteds}>
                    Completed
                </a>
            </li>
        </ul>
        {clearButton}
    </footer>
}
