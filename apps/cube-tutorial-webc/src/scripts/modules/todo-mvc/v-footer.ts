import { FooterScope, ShowingOptions } from 'wdc-cube-tutorial-core/todo-mvc'

import { AppElement, type AppDom } from '../../widgets'

import Css from './todo-mvc.module.scss'

export class FooterView extends AppElement<FooterScope> {
    private count!: HTMLElement
    private word!: Text
    private clear!: HTMLButtonElement
    private readonly filters = new Map<ShowingOptions, HTMLAnchorElement>()

    private readonly onShowAll = this.action('onShowAll', () => this.scope.actions.onShowAll())
    private readonly onShowActives = this.action('onShowActives', () => this.scope.actions.onShowActives())
    private readonly onShowCompleteds = this.action('onShowCompleteds', () => this.scope.actions.onShowCompleteds())
    private readonly onClearCompleted = this.action('onClearCompleted', () => this.scope.actions.onClearCompleted())

    protected declare(dom: AppDom): void {
        dom.footer((footer) => {
            footer.className = Css.footer

            dom.span((span) => {
                span.className = Css.todoCount
                this.count = dom.strong()
                this.word = dom.text(' items left')
            })

            dom.ul((list) => {
                list.className = Css.filters
                this.filter(dom, ShowingOptions.ALL, 'All', this.onShowAll)
                this.filter(dom, ShowingOptions.ACTIVE, 'Active', this.onShowActives)
                this.filter(dom, ShowingOptions.COMPLETED, 'Completed', this.onShowCompleteds)
            })

            this.clear = dom.button((button) => {
                button.className = Css.clearCompleted
                button.textContent = 'Clear completed'
                button.addEventListener('click', this.onClearCompleted)
            })
        })
    }

    private filter(dom: AppDom, showing: ShowingOptions, label: string, onShow: (event: Event) => void): void {
        dom.li(() => {
            const link = dom.element('a', (anchor) => {
                anchor.textContent = label
                anchor.addEventListener('click', onShow)
            })
            this.filters.set(showing, link)
        })
    }

    protected override onUpdate(): void {
        const scope = this.scope

        this.setText(this.count, String(scope.count))
        this.setText(this.word, ` ${scope.activeTodoWord} left`)
        this.setVisible(this.clear, scope.clearButtonVisible)

        for (const [showing, link] of this.filters) {
            this.setClass(link, Css.selected, showing === scope.showing)
        }
    }
}
