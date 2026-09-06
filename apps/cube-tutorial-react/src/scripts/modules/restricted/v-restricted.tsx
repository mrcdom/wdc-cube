import { Logger } from 'wdc-cube'
import { classToFComponent, FCClass, type IViewProps, ViewSlot } from 'wdc-cube-react'
import { RestrictedScope } from 'wdc-cube-tutorial-core/restricted'
import Css from './restricted.module.scss'
import clsx from 'clsx'

const LOG = Logger.get('RestrictedView')

type RestrictedViewProps = IViewProps & { scope: RestrictedScope }

class RestrictedViewClass extends FCClass<RestrictedViewProps> {
    render({ className, ...props }: RestrictedViewProps) {
        LOG.debug('update')

        const detail = this.scope.detail

        return (
            <div className={clsx(className, Css.restrictedView)} {...props}>
                {detail ? (
                    // The slot this presenter offered to whatever place sits deeper
                    // in the tree. Rendering this.scope here instead would resolve
                    // back to this very view, since RestrictedScope is registered to
                    // it — an unbounded recursion that takes the tab down with it.
                    <ViewSlot scope={detail} />
                ) : (
                    <p>Nothing is nested under this place yet.</p>
                )}
            </div>
        )
    }
}

export const RestrictedView = classToFComponent(RestrictedViewClass)
