import { Logger } from 'wdc-cube'
import { classToFComponent, FCClass, type IViewProps, ViewSlot } from 'wdc-cube-react'
import { RestrictedScope } from '../restricted.scope'
import Css from './restricted.module.scss'
import clsx from 'clsx'

const LOG = Logger.get('RestrictedView')

type RestrictedViewProps = IViewProps & { scope: RestrictedScope }

class RestrictedViewClass extends FCClass<RestrictedViewProps> {
    render({ className, ...props }: RestrictedViewProps) {
        LOG.debug('update')

        return (
            <div className={clsx(className, Css.restrictedView)} {...props}>
                <ViewSlot scope={this.scope} />
            </div>
        )
    }
}

export const RestrictedView = classToFComponent(RestrictedViewClass)
