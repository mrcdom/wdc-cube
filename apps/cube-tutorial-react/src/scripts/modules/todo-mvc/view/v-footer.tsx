import clsx from 'clsx'
import { Logger } from 'wdc-cube'
import { classToFComponent, FCClass, type IViewProps } from 'wdc-cube-react'
import Css from './todo-mvc.module.scss'
import { FooterScope, ShowingOptions } from 'wdc-cube-tutorial-core/todo-mvc'

const LOG = Logger.get('TodoMvc.FooterView')

type FooterViewProps = IViewProps & { scope: FooterScope }

class FooterViewClass extends FCClass<FooterViewProps> {
    private readonly onClearCompleted = () => this.scope.actions.onClearCompleted()
    private readonly onShowAll = () => this.scope.actions.onShowAll()
    private readonly onShowActives = () => this.scope.actions.onShowActives()
    private readonly onShowCompleteds = () => this.scope.actions.onShowCompleteds()

    render({ className, style }: FooterViewProps) {
        LOG.debug('update')

        const scope = this.scope

        return (
            <footer className={clsx(className, Css.footer)} style={style}>
                <span className={Css.todoCount}>
                    <strong>{scope.count}</strong> {scope.activeTodoWord} left
                </span>
                <ul className={Css.filters}>
                    <li>
                        <a
                            className={clsx(scope.showing == ShowingOptions.ALL ? Css.selected : undefined)}
                            onClick={this.onShowAll}
                        >
                            All
                        </a>
                    </li>{' '}
                    <li>
                        <a
                            className={clsx(scope.showing == ShowingOptions.ACTIVE ? Css.selected : undefined)}
                            onClick={this.onShowActives}
                        >
                            Active
                        </a>
                    </li>{' '}
                    <li>
                        <a
                            className={clsx(scope.showing == ShowingOptions.COMPLETED ? Css.selected : undefined)}
                            onClick={this.onShowCompleteds}
                        >
                            Completed
                        </a>
                    </li>
                </ul>
                {scope.clearButtonVisible ? (
                    <button className={Css.clearCompleted} onClick={this.onClearCompleted}>
                        Clear completed
                    </button>
                ) : null}
            </footer>
        )
    }
}

export const FooterView = classToFComponent(FooterViewClass)
