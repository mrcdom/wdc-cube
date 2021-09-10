import React, { HTMLAttributes } from 'react'
import Button from '@material-ui/core/Button'
import ButtonGroup from '@material-ui/core/ButtonGroup'
import { bindUpdate } from 'wdc-cube-react'
import { BodyScope } from './MainPresenter'
import Css from './MainView.module.css'

type MainBodyViewProps = { scope: BodyScope } & HTMLAttributes<HTMLDivElement>

const Styles = {
    alertPane: {
        marginLeft: 10
    }
}

export function MainBodyView({ className, style, scope }: MainBodyViewProps) {
    bindUpdate(React, scope)

    return <>
        <div className={(className || '') + ' ' + Css.BodyView} style={style}>
            <h3>Alert examples</h3>
            <div style={Styles.alertPane}>
                <ButtonGroup color="primary" aria-label="outlined primary button group">
                    <Button onClick={() => scope.onAlert('info')}>info</Button>
                    <Button onClick={() => scope.onAlert('success')}>success</Button>
                    <Button onClick={() => scope.onAlert('warning')}>warning</Button>
                    <Button onClick={() => scope.onAlert('error')}>error</Button>
                </ButtonGroup>
            </div>
        </div>
    </>
}
