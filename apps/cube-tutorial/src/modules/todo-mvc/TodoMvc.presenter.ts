/*
 * Based on https://todomvc.com/examples/react
 */

import { Logger, Presenter, Scope, ScopeSlot, PlaceUri, NOOP_VOID } from 'wdc-cube'
import { v4 as uuidv4 } from 'uuid'
import { TutorialService } from '../../services/TutorialService'
import { MainPresenter } from '../../main/Main.presenter'
import { ViewIds, AttrsIds } from '../../Constants'

const LOG = Logger.get('TodoMvcPresenter')

// @Inject
const tutorialService = TutorialService.INSTANCE

// :: Scopes

export enum ShowingTodos {
    ALL,
    ACTIVE,
    COMPLETED
}

export class ItemScope extends Scope {
    id = 0
    completed = false
    editing = false
    title = ''
    editText = ''
    focus = false

    onToggle = Scope.ACTION()
    onEdit = Scope.ACTION()
    onChange = Scope.ACTION1<string>()
    onKeyDown = Scope.ACTION1<string>()
    onBlur = Scope.ACTION()
    onDestroy = Scope.ACTION()
}

export class MainScope extends Scope {
    uuid = uuidv4()
    items = [] as ItemScope[]
    allItemsCompleted = false
    toggleButtonVisible = false

    onToggleAll = Scope.ACTION()
}

export class FooterScope extends Scope {
    count = 0
    activeTodoWord = 'item'
    clearButtonVisible = false
    showing = ShowingTodos.ALL

    onClearCompleted = Scope.ACTION()
    onShowAll = Scope.ACTION()
    onShowActives = Scope.ACTION()
    onShowCompleteds = Scope.ACTION()
}

export class TodoMvcScope extends Scope {
    main?: MainScope
    footer?: FooterScope

    onAddTodo = Scope.ACTION1<string>()
}

// :: Presentation

export class TodoMvcPresenter extends Presenter<MainPresenter, TodoMvcScope> {

    private parentSlot: ScopeSlot = NOOP_VOID

    private mainScope = new MainScope(ViewIds.todoMain)

    private footerScope = new FooterScope(ViewIds.todoFooter)

    private itemScopes = [] as ItemScope[]

    public constructor(app: MainPresenter) {
        super(app, new TodoMvcScope(ViewIds.module1))
    }

    public override release() {
        super.release()
        LOG.info('Finalized')
    }

    public override async applyParameters(uri: PlaceUri, initialization: boolean): Promise<boolean> {
        if (initialization) {
            // Bind Events
            this.scope.onAddTodo = this.onAddTodo.bind(this)
            this.mainScope.onToggleAll = this.onToggleAll.bind(this)
            this.footerScope.onClearCompleted = this.onClearCompleted.bind(this)
            this.footerScope.onShowAll = this.onShowAll.bind(this)
            this.footerScope.onShowActives = this.onShowActives.bind(this)
            this.footerScope.onShowCompleteds = this.onShowCompleteds.bind(this)

            // Get slots
            this.parentSlot = uri.getScopeSlot(AttrsIds.parentSlot)

            // Load and prepare data
            await this.loadData()

            LOG.info('Initialized')
        }

        this.parentSlot(this.scope)

        return true
    }

    public override onBeforeScopeUpdate() {
        this.mainScope.items.length = 0
        this.mainScope.allItemsCompleted = false
        this.mainScope.toggleButtonVisible = false

        let totalNumOfCompletedTask = 0

        if (this.itemScopes.length > 0) {
            let completeCount = 0
            for (const itemScope of this.itemScopes) {
                if (itemScope.completed) {
                    totalNumOfCompletedTask++
                }

                switch (this.footerScope.showing) {
                    case ShowingTodos.ACTIVE:
                        if (!itemScope.completed) {
                            this.mainScope.items.push(itemScope)
                        }
                        break
                    case ShowingTodos.COMPLETED:
                        if (itemScope.completed) {
                            this.mainScope.items.push(itemScope)
                            completeCount++
                        }
                        break
                    default:
                        if (itemScope.completed) {
                            completeCount++
                        }
                        this.mainScope.items.push(itemScope)
                }
            }

            this.mainScope.allItemsCompleted = completeCount !== this.mainScope.items.length
            this.mainScope.toggleButtonVisible = this.mainScope.items.length !== 0
            this.update(this.mainScope)
        }

        if (this.mainScope.items.length > 0) {
            this.update(this.mainScope)

            this.scope.main = this.mainScope
            this.update(this.scope)
        } else if (this.scope.main) {
            this.scope.main = undefined
            this.update(this.scope)
        }

        if (this.itemScopes.length > 0) {
            const showClearButton = totalNumOfCompletedTask > 0
            if (this.footerScope.clearButtonVisible !== showClearButton) {
                this.footerScope.clearButtonVisible = showClearButton
                this.update(this.footerScope)
            }

            if (this.footerScope.count !== this.mainScope.items.length) {
                this.footerScope.count = this.mainScope.items.length
                if (this.footerScope.count > 1) {
                    this.footerScope.activeTodoWord = 'items'
                } else {
                    this.footerScope.activeTodoWord = 'item'
                }
                this.update(this.footerScope)
            }

            if (this.scope.footer != this.footerScope) {
                this.scope.footer = this.footerScope
                this.update(this.scope)
            }
        } else if (this.scope.footer) {
            this.scope.footer = undefined
            this.update(this.scope)
        }
    }

    private async loadData() {
        this.itemScopes.length = 0
        try {
            const todos = await tutorialService.fetchTodos()
            for (const todo of todos) {
                const todoScope = new ItemScope(ViewIds.todoItem)
                todoScope.id = todo.uid
                todoScope.title = todo.text
                todoScope.editText = todo.text
                todoScope.completed = todo.complete
                this.bindItemScope(todoScope)
                this.itemScopes.push(todoScope)
            }
        } finally {
            this.update(this.scope)
        }
    }

    protected async onAddTodo(val: string) {
        const lastUid = this.itemScopes.reduce((accum, todo) => Math.max(todo.id, accum), 0)

        const todoScope = new ItemScope(ViewIds.todoItem)
        todoScope.id = lastUid + 1
        todoScope.title = val
        todoScope.editText = val
        todoScope.completed = false
        this.bindItemScope(todoScope)
        this.itemScopes.push(todoScope)

        this.update(this.mainScope)
    }

    protected async onToggleAll() {
        let numOfCompletedTasks = 0
        for (const itemScope of this.itemScopes) {
            if (itemScope.completed) {
                numOfCompletedTasks++
            }
        }

        const checked = numOfCompletedTasks !== this.mainScope.items.length

        for (const itemScope of this.itemScopes) {
            if (itemScope.completed !== checked) {
                itemScope.completed = checked
                this.update(itemScope)
            }
        }
    }

    protected async onClearCompleted() {
        this.itemScopes = this.itemScopes.filter(item => !item.completed)
        this.update(this.mainScope)
    }

    protected async onShowAll() {
        if (this.footerScope.showing !== ShowingTodos.ALL) {
            this.footerScope.showing = ShowingTodos.ALL
            this.update(this.footerScope)
        }
    }

    protected async onShowActives() {
        if (this.footerScope.showing !== ShowingTodos.ACTIVE) {
            this.footerScope.showing = ShowingTodos.ACTIVE
            this.update(this.footerScope)
        }
    }

    protected async onShowCompleteds() {
        if (this.footerScope.showing !== ShowingTodos.COMPLETED) {
            this.footerScope.showing = ShowingTodos.COMPLETED
            this.update(this.footerScope)
        }
    }

    private bindItemScope(item: ItemScope) {
        item.onToggle = this.onItemToggle.bind(this, item)
        item.onEdit = this.onItemEdit.bind(this, item)
        item.onChange = this.onItemChange.bind(this, item)
        item.onKeyDown = this.onItemKeyDown.bind(this, item)
        item.onBlur = this.onItemBlur.bind(this, item)
        item.onDestroy = this.onItemDestroy.bind(this, item)
    }

    protected async onItemToggle(item: ItemScope) {
        item.completed = !item.completed
        this.update(item)
    }

    protected async onItemEdit(item: ItemScope) {
        for (const otherItem of this.itemScopes) {
            if (otherItem !== item && otherItem.editing) {
                otherItem.editing = false
                this.update(otherItem)
            }
        }

        if (!item.editing) {
            item.editing = true
            item.focus = true
            this.update(item)
        }
    }

    protected async onItemChange(item: ItemScope, text: string) {
        item.editText = text
        this.update(item)
    }

    protected async onItemBlur(item: ItemScope) {
        const val = item.editText.trim()
        if (val) {
            if (item.editText !== val) {
                item.editText = val
                this.update(item)
            }
            this.saveItem(item)
        } else {
            await this.onItemDestroy(item)
        }
    }

    protected async onItemKeyDown(item: ItemScope, code: string) {
        if (code === 'Escape') {
            if (item.editText !== item.title) {
                item.editText = item.title
                this.update(item)
            }
            this.cancelItem(item)
        } else if (code === 'Enter') {
            await this.onItemBlur(item)
        }
    }

    protected async onItemDestroy(item: ItemScope) {
        const itemIdx = this.itemScopes.findIndex(i => i.id === item.id)
        if (itemIdx !== -1) {
            this.itemScopes.splice(itemIdx, 1)
            this.update(this.mainScope)
        }
    }

    protected cancelItem(item: ItemScope) {
        item.editText = item.title
        item.editing = false
        this.update(item)
    }

    protected saveItem(item: ItemScope) {
        item.title = item.editText
        item.editing = false
        this.update(item)
    }

}