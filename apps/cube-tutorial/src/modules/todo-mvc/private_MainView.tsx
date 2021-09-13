import React from 'react'
import clsx from 'clsx'
import { bindUpdate, ViewFactory } from 'wdc-cube-react'
import Css from './TodoMvc.module.css'
import { MainScope } from './TodoMvcPresenter'

type MainViewProps = {
    className?: string
    style?: React.CSSProperties
    scope: MainScope
}

export function MainView({ scope, className, style }: MainViewProps) {
    bindUpdate(React, scope)

    return <section className={clsx(className, Css.main)} style={style}>
        <input
            id={scope.uuid}
            className={Css['toggle-all']}
            type="checkbox"
            onChange={scope.onToggleAll}
            checked={!scope.toggleButtonVisible}
        />
        <label htmlFor={scope.uuid} style={{opacity: scope.toggleButtonVisible ? 1 : 0}}>
            Mark all as complete
        </label>
        <ul className={Css['todo-list']}>
            {scope.items.map(item => ViewFactory.createView(item, {key: item.id}))}
        </ul>
    </section>
}