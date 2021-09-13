import React from 'react'
import clsx from 'clsx'
import Button from '@material-ui/core/Button'
import ButtonGroup from '@material-ui/core/ButtonGroup'
import { bindUpdate, IViewProps } from 'wdc-cube-react'
import { BodyScope } from './Main.presenter'
import Css from './Main.module.css'

type BodyViewProps = { scope: BodyScope } & IViewProps<HTMLDivElement>

export function BodyView({ scope, className, ...props }: BodyViewProps) {
    bindUpdate(React, scope)

    return <>
        <div className={clsx(className, Css.BodyView)} {...props}>
            <h3>Alert examples</h3>
            <ButtonGroup className={Css.buttonPane} color="primary" aria-label="outlined primary button group">
                <Button onClick={() => scope.onAlert('info')}>info</Button>
                <Button onClick={() => scope.onAlert('success')}>success</Button>
                <Button onClick={() => scope.onAlert('warning')}>warning</Button>
                <Button onClick={() => scope.onAlert('error')}>error</Button>
            </ButtonGroup>
        </div>
    </>
}
