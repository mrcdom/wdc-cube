import React from 'react'
import clsx from 'clsx'
import { Logger } from 'wdc-cube'
import { bindUpdate, IViewProps, ViewSlot } from 'wdc-cube-react'
import { RestrictedScope } from '../Restricted.scopes'
import Css from './Restricted.module.css'

const LOG = Logger.get('RestrictedView')

type RestrictedViewProps = IViewProps & { scope: RestrictedScope }

export function RestrictedView({ scope, className, ...props }: RestrictedViewProps) {
    LOG.debug('update')

    bindUpdate(React, scope)

    return <div className={clsx(className, Css.View)} {...props}>
        <ViewSlot scope={scope} />
    </div>
}