import clsx from 'clsx'
import { Logger } from 'wdc-cube'
import { classToFComponent, FCClass, type IViewProps, ViewSlot } from 'wdc-cube-react'
import { TodoMvcScope } from '../todo-mvc.scope'
import Css from './todo-mvc.module.scss'

import { HeaderView } from './v-header'
import { MainView } from './v-main'
import { FooterView } from './v-footer'

const LOG = Logger.get('TodoMvc.View')

type TodoMvcViewProps = IViewProps & { scope: TodoMvcScope }

class TodoMvcViewClass extends FCClass<TodoMvcViewProps> {
    private readonly onToggleStress = () => this.scope.actions.onToggleStress()

    render({ className, style }: TodoMvcViewProps) {
        LOG.debug('update')

        const stressMode = this.scope.stressMode

        return (
            <div className={clsx(className, Css.todoMvcView)} style={style}>
                <div className={Css.body}>
                    <h1>todos</h1>
                    <div className={Css.todoApp}>
                        <ViewSlot scope={this.scope.header} view={HeaderView} optional />
                        <ViewSlot scope={this.scope.main} view={MainView} optional />
                        <ViewSlot scope={this.scope.footer} view={FooterView} optional />
                    </div>

                    <footer className={Css.info}>
                        <p>
                            {stressMode
                                ? 'Stress mode: 1000 generated items and a clock ticking every second.'
                                : 'Showing a small sample list.'}
                        </p>
                        <button className={Css.stressToggle} onClick={this.onToggleStress}>
                            {stressMode ? 'Back to the sample list' : 'Run the stress test'}
                        </button>
                    </footer>
                </div>
            </div>
        )
    }
}

export const TodoMvcView = classToFComponent(TodoMvcViewClass)
