import React, { HTMLAttributes } from 'react'
import { bindUpdate, ViewFactory } from 'wdc-cube-react'
import { RestrictedScope } from './RestrictedPresenter'
import Css from './RestrictedView.module.css'

type RestrictedViewProps = { scope: RestrictedScope } & HTMLAttributes<HTMLDivElement>

export function RestrictedView({ className, style, scope }: RestrictedViewProps) {
    bindUpdate(React, scope)

    const detailView = ViewFactory.createView(scope.detail)

    return <>
        <div className={(className || '') + ' ' + Css.View} style={style}>
            {detailView}
        </div>
    </>
}