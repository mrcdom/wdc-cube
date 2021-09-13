import React from 'react'
import clsx from 'clsx'
import { bindUpdate, ViewFactory } from 'wdc-cube-react'
import { RestrictedScope } from './RestrictedPresenter'
import type { HTMLDivProps } from '../../utils/ReactPropertyTypes'
import Css from './RestrictedView.module.css'

type RestrictedViewProps = { scope: RestrictedScope } & HTMLDivProps

export function RestrictedView({ scope, className, ...props }: RestrictedViewProps) {
    bindUpdate(React, scope)

    const detailView = ViewFactory.createView(scope.detail)

    return <>
        <div className={clsx(className, Css.View)} {...props}>
            {detailView}
        </div>
    </>
}