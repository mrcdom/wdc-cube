import clsx from 'clsx'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import { Logger } from 'wdc-cube'
import { classToFComponent, FCClass, type IViewProps } from 'wdc-cube-react'
import { BodyScope } from '../main.scope'
import Css from './main.module.scss'

const LOG = Logger.get('Main.BodyView')

type BodyViewProps = IViewProps & { scope: BodyScope }

class BodyViewClass extends FCClass<BodyViewProps> {
    private readonly onOpenInfo = () => this.scope.onOpenAlert('info')
    private readonly onOpenSuccess = () => this.scope.onOpenAlert('success')
    private readonly onOpenWarning = () => this.scope.onOpenAlert('warning')
    private readonly onOpenError = () => this.scope.onOpenAlert('error')

    render({ className, ...props }: BodyViewProps) {
        LOG.debug('update')

        return (
            <div className={clsx(className, Css.bodyView)} {...props}>
                <h3>Alert examples</h3>
                <ButtonGroup className={Css.buttonPane} color="primary" aria-label="outlined primary button group">
                    <Button onClick={this.onOpenInfo}>info</Button>
                    <Button onClick={this.onOpenSuccess}>success</Button>
                    <Button onClick={this.onOpenWarning}>warning</Button>
                    <Button onClick={this.onOpenError}>error</Button>
                </ButtonGroup>
            </div>
        )
    }
}

export const BodyView = classToFComponent(BodyViewClass)
