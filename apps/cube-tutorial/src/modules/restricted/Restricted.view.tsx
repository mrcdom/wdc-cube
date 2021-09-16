import React from 'react'
import clsx from 'clsx'
import { Logger } from 'wdc-cube'
import { bindUpdate, ViewFactory, IViewProps } from 'wdc-cube-react'
import { RestrictedScope } from './Restricted.presenter'
import Css from './Restricted.module.css'

const LOG = Logger.get('RestrictedView')

type RestrictedViewProps = IViewProps & { scope: RestrictedScope }

export function RestrictedView({ scope, className, ...props }: RestrictedViewProps) {
    bindUpdate(React, scope)

    LOG.debug('update')

    const detailView = ViewFactory.createView(scope.detail)

    return <div className={clsx(className, Css.View)} {...props}>
        {detailView}
    </div>
}