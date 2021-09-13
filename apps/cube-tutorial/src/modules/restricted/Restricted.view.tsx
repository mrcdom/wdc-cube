import React from 'react'
import clsx from 'clsx'
import { bindUpdate, ViewFactory, IViewProps } from 'wdc-cube-react'
import { RestrictedScope } from './Restricted.presenter'
import Css from './Restricted.module.css'

type RestrictedViewProps = { scope: RestrictedScope } & IViewProps<HTMLDivElement>

export function RestrictedView({ scope, className, ...props }: RestrictedViewProps) {
    bindUpdate(React, scope)

    const detailView = ViewFactory.createView(scope.detail)

    return <div className={clsx(className, Css.View)} {...props}>
    {detailView}
</div>
}