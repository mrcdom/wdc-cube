import { CubeElement, Dom } from 'wdc-cube-webcomponents'
import { FooterScope, ShowingOptions } from 'wdc-cube-tutorial-core/todo-mvc'

export class FooterView extends CubeElement<FooterScope> {
    private count!: HTMLElement
    private word!: Text
    private clear!: HTMLButtonElement
    private readonly filters = new Map<ShowingOptions, HTMLAnchorElement>()

    protected declare(dom: Dom): void {
        dom.footer((footer) => {
            footer.className = 'footer'

            dom.span((span) => {
                span.className = 'todo-count'
                this.count = dom.strong()
                this.word = dom.text(' items left')
            })

            dom.ul((list) => {
                list.className = 'filters'
                this.filter(dom, ShowingOptions.ALL, 'All', () => this.scope.actions.onShowAll())
                this.filter(dom, ShowingOptions.ACTIVE, 'Active', () => this.scope.actions.onShowActives())
                this.filter(dom, ShowingOptions.COMPLETED, 'Completed', () => this.scope.actions.onShowCompleteds())
            })

            this.clear = dom.button((button) => {
                button.className = 'clear-completed'
                button.textContent = 'Clear completed'
                button.addEventListener('click', () =>
                    this.safeAction('onClearCompleted', () => this.scope.actions.onClearCompleted())
                )
            })
        })
    }

    private filter(dom: Dom, showing: ShowingOptions, label: string, action: () => unknown): void {
        dom.li(() => {
            const link = dom.element('a', (anchor) => {
                anchor.textContent = label
                anchor.addEventListener('click', () => this.safeAction(`onShow:${label}`, action))
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
            this.setClass(link, 'selected', showing === scope.showing)
        }
    }
}
