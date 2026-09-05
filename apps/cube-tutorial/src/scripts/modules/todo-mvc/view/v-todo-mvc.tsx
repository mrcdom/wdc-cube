import clsx from 'clsx'
import { Logger } from 'wdc-cube'
import { classToFComponent, type FCClassContext, type IViewProps, ViewSlot } from 'wdc-cube-react'
import { TodoMvcScope } from '../todo-mvc.scope'
import Css from './todo-mvc.module.scss'

import { HeaderView } from './v-header'
import { MainView } from './v-main'
import { FooterView } from './v-footer'

const LOG = Logger.get('TodoMvc.View')

type TodoMvcViewProps = IViewProps & { scope: TodoMvcScope }

class TodoMvcViewClass implements FCClassContext<TodoMvcViewProps> {
    scope!: TodoMvcScope

    render({ className, style }: TodoMvcViewProps) {
        LOG.debug('update')

        return (
            <div className={clsx(className, Css.todoMvcView)} style={style}>
                <div className={Css.body}>
                    <h1>todos</h1>
                    <div className={Css.todoApp}>
                        <ViewSlot scope={this.scope.header} view={HeaderView} optional />
                        <ViewSlot scope={this.scope.main} view={MainView} optional />
                        <ViewSlot scope={this.scope.footer} view={FooterView} optional />
                    </div>
                </div>
            </div>
        )
    }
}

export const TodoMvcView = classToFComponent<TodoMvcViewProps>(TodoMvcViewClass)
