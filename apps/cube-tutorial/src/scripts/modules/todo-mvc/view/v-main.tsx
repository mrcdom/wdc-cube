import clsx from 'clsx'
import { Logger } from 'wdc-cube'
import { classToFComponent, FCClass, type IViewProps, ViewSlot } from 'wdc-cube-react'
import Css from './todo-mvc.module.scss'
import { MainScope } from '../todo-mvc.scope'
import { ItemView } from './v-item'
import { ClockView } from './v-clock'

const LOG = Logger.get('TodoMvc.MainView')

type MainViewProps = IViewProps & { scope: MainScope }

class MainViewClass extends FCClass<MainViewProps> {
    render({ className, style }: MainViewProps) {
        LOG.debug('update')

        return (
            <section className={clsx(className, Css.main)} style={style}>
                <ul className={Css.todoList}>
                    <ViewSlot scope={this.scope.clock} view={ClockView} />
                    {this.scope.items.map((todo) => (
                        <ViewSlot key={todo.id} scope={todo} view={ItemView} />
                    ))}
                </ul>
            </section>
        )
    }
}

export const MainView = classToFComponent(MainViewClass)
