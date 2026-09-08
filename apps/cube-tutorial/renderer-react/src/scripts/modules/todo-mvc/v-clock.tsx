import clsx from 'clsx'
import { Logger } from 'wdc-cube'
import { classToFComponent, FCClass, type IViewProps } from 'wdc-cube-react'
import { ClockScope } from 'wdc-cube-tutorial-presentation/todo-mvc'
import Css from './todo-mvc.module.scss'

const LOG = Logger.get('TodoMvc.ClockScope')

type ClockViewProps = IViewProps & { scope: ClockScope }

class ClockViewClass extends FCClass<ClockViewProps> {
    render({ className, style }: ClockViewProps) {
        LOG.debug('update')

        return (
            <li className={clsx(className, Css.clock)} style={style}>
                <div>{this.scope.date.toLocaleTimeString()}</div>
            </li>
        )
    }
}

export const ClockView = classToFComponent(ClockViewClass)
