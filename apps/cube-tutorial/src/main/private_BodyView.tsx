import React from 'react'
import clsx from 'clsx'
import Button from '@material-ui/core/Button'
import ButtonGroup from '@material-ui/core/ButtonGroup'
import { Logger} from 'wdc-cube'
import { bindUpdate, IViewProps } from 'wdc-cube-react'
import { BodyScope } from './Main.presenter'
import Css from './Main.module.css'

const LOG = Logger.get('Main.BodyView')

type BodyViewProps = IViewProps & { scope: BodyScope }

export function BodyView({ scope, className, ...props }: BodyViewProps) {
    bindUpdate(React, scope)

    LOG.debug('update')

    return <>
        <div className={clsx(className, Css.BodyView)} {...props}>
            <h3>Alert examples</h3>
            <ButtonGroup className={Css.buttonPane} color="primary" aria-label="outlined primary button group">
                <Button onClick={() => scope.onOpenAlert('info')}>info</Button>
                <Button onClick={() => scope.onOpenAlert('success')}>success</Button>
                <Button onClick={() => scope.onOpenAlert('warning')}>warning</Button>
                <Button onClick={() => scope.onOpenAlert('error')}>error</Button>
            </ButtonGroup>
        </div>
    </>
}
