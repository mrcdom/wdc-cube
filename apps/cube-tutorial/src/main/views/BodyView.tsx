import React, { useCallback } from 'react'
import clsx from 'clsx'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import { Logger } from 'wdc-cube'
import { bindUpdate, IViewProps } from 'wdc-cube-react'
import { BodyScope } from '../Main.scopes'
import Css from './Main.module.css'

const LOG = Logger.get('Main.BodyView')

type BodyViewProps = IViewProps & { scope: BodyScope }

export function BodyView({ scope, className, ...props }: BodyViewProps) {
    bindUpdate(React, scope)

    LOG.debug('update')

    const onOpenInfo = useCallback(() => scope.onOpenAlert('info'), [scope.onOpenAlert])
    const onOpenSuccess = useCallback(() => scope.onOpenAlert('success'), [scope.onOpenAlert])
    const onOpenWarning = useCallback(() => scope.onOpenAlert('warning'), [scope.onOpenAlert])
    const onOpenError = useCallback(() => scope.onOpenAlert('error'), [scope.onOpenAlert])

    return <>
        <div className={clsx(className, Css.BodyView)} {...props}>
            <h3>Alert examples</h3>
            <ButtonGroup className={Css.buttonPane} color="primary" aria-label="outlined primary button group">
                <Button onClick={onOpenInfo}>info</Button>
                <Button onClick={onOpenSuccess}>success</Button>
                <Button onClick={onOpenWarning}>warning</Button>
                <Button onClick={onOpenError}>error</Button>
            </ButtonGroup>
        </div>
    </>
}
