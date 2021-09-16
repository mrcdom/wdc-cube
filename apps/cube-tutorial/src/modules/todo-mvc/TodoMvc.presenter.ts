/*
 * Based on https://todomvc.com/examples/react
 */

import { Logger, Presenter, Scope, ScopeSlot, PlaceUri, NOOP_VOID } from 'wdc-cube'
import { v4 as uuidv4 } from 'uuid'
import { TutorialService } from '../../services/TutorialService'
import { MainPresenter } from '../../main/Main.presenter'
import { ViewIds, ParamsIds, AttrsIds } from '../../Constants'

const LOG = Logger.get('TodoMvcPresenter')

// @Inject
const tutorialService = TutorialService.INSTANCE

// :: Scopes

export enum ShowingOptions {
    ALL,
    ACTIVE,
    COMPLETED
}

export class ItemScope extends Scope {
    vid = ViewIds.todosItem

    id = 0
    completed = false
    editing = false
    title = ''

    readonly actions = {
        onToggle: Scope.ACTION(),
        onEdit: Scope.ACTION(),
        onKeyDown: Scope.ACTION2<string, string>(),
        onBlur: Scope.ACTION1<string>(),
        onDestroy: Scope.ACTION()
    }
}

export class HeaderScope extends Scope {
    vid = ViewIds.todosHeader

    uuid = uuidv4()
    allItemsCompleted = false
    toggleButtonVisible = false

    readonly actions = {
        onToggleAll: Scope.ACTION(),
        onAddTodo: Scope.ACTION1<string>()
    }
}

export class MainScope extends Scope {
    vid = ViewIds.todosMain

    items = [] as ItemScope[]
}

export class FooterScope extends Scope {
    vid = ViewIds.todosFooter

    count = 0
    activeTodoWord = 'item'
    clearButtonVisible = false
    showing = ShowingOptions.ALL

    readonly actions = {
        onClearCompleted: Scope.ACTION(),
        onShowAll: Scope.ACTION(),
        onShowActives: Scope.ACTION(),
        onShowCompleteds: Scope.ACTION()
    }
}

export class TodoMvcScope extends Scope {
    vid = ViewIds.todos

    header?: HeaderScope
    main?: MainScope
    footer?: FooterScope
}

// :: Presentation

export class TodoMvcPresenter extends Presenter<MainPresenter, TodoMvcScope> {

    private parentSlot: ScopeSlot = NOOP_VOID

    private headerScope = new HeaderScope()

    private mainScope = new MainScope()

    private footerScope = new FooterScope()

    private itemScopes = [] as ItemScope[]

    private stressEnabled = false

    private updateHintEnabled = true

    public constructor(app: MainPresenter) {
        super(app, new TodoMvcScope())
        this.scope.header = this.headerScope
    }

    public override release() {
        super.release()
        LOG.debug('Finalized')
    }

    public override async applyParameters(uri: PlaceUri, initialization: boolean): Promise<boolean> {
        const uriShowing = uri.getParameterAsNumberOrDefault(ParamsIds.TodoShowing, this.footerScope.showing) as ShowingOptions
        const isStress = uri.getParameterAsBooleanOrDefault(ParamsIds.TodoStress, this.stressEnabled)

        if (initialization) {
            // Bind Events
            this.headerScope.actions.onAddTodo = this.onAddTodo.bind(this)
            this.headerScope.actions.onToggleAll = this.onToggleAll.bind(this)

            this.footerScope.actions.onClearCompleted = this.onClearCompleted.bind(this)
            this.footerScope.actions.onShowAll = this.onShowAll.bind(this)
            this.footerScope.actions.onShowActives = this.onShowActives.bind(this)
            this.footerScope.actions.onShowCompleteds = this.onShowCompleteds.bind(this)

            this.footerScope.showing = uriShowing

            // Configure fallback scope that must be used when there were
            // to many small updates
            this.configureUpdate(ViewIds.todosItem, 10, this.mainScope)

            // Get slots
            this.parentSlot = uri.getScopeSlot(AttrsIds.parentSlot)

            this.enableAutoUpdate()

            // Load and prepare data
            this.stressEnabled = isStress
            await this.loadData(isStress ? 1000 : 0)

            LOG.debug('Initialized')
        } else {
            this.footerScope.showing = uriShowing

            if (this.stressEnabled !== isStress) {
                this.stressEnabled = isStress
                await this.loadData(isStress ? 1000 : 0)
            }
        }

        this.parentSlot(this.scope)

        return true
    }

    public publishParameters(uri: PlaceUri): void {
        if (this.footerScope.showing !== ShowingOptions.ALL) {
            uri.setParameter(ParamsIds.TodoShowing, this.footerScope.showing)
        }

        if (this.stressEnabled) {
            uri.setParameter(ParamsIds.TodoStress, this.stressEnabled)
        }
    }

    private async loadData(quantity: number) {
        this.itemScopes.length = 0

        const todos = await tutorialService.fetchTodos(quantity)
        for (const todo of todos) {
            const todoScope = new ItemScope()
            todoScope.id = todo.uid
            todoScope.title = todo.text
            todoScope.completed = todo.complete
            this.bindItemScopeActions(todoScope)
            this.itemScopes.push(todoScope)
        }
    }

    protected async onAddTodo(val: string) {
        const trimVal = val ? val.trim() : ''
        if (trimVal) {
            const lastUid = this.itemScopes.reduce((accum, todo) => Math.max(todo.id, accum), 0)

            const todoScope = new ItemScope()
            todoScope.id = lastUid + 1
            todoScope.title = val
            todoScope.completed = false
            this.bindItemScopeActions(todoScope)
            this.itemScopes.push(todoScope)

            this.updateHint(this.mainScope)
        } else {
            this.updateHint(this.headerScope)
        }
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

                // Optional update hint (improve performance)
                this.updateHint(itemScope)
            }
        }
    }

    protected async onClearCompleted() {
        this.itemScopes = this.itemScopes.filter(item => !item.completed)
        this.updateHint(this.mainScope)
    }

    protected async onShowAll() {
        this.footerScope.showing = ShowingOptions.ALL
        this.updateHint(this.footerScope)
        this.app.updateHistory()
    }

    protected async onShowActives() {
        this.footerScope.showing = ShowingOptions.ACTIVE
        this.updateHint(this.footerScope)
        this.app.updateHistory()
    }

    protected async onShowCompleteds() {
        this.footerScope.showing = ShowingOptions.COMPLETED
        this.updateHint(this.footerScope)
        this.app.updateHistory()
    }

    private bindItemScopeActions(item: ItemScope) {
        item.actions.onToggle = this.onItemToggle.bind(this, item)
        item.actions.onEdit = this.onItemEdit.bind(this, item)
        item.actions.onKeyDown = this.onItemKeyDown.bind(this, item)
        item.actions.onBlur = this.onItemBlur.bind(this, item)
        item.actions.onDestroy = this.onItemDestroy.bind(this, item)
    }

    protected async onItemToggle(item: ItemScope) {
        item.completed = !item.completed

        // Optional update hint (improve performance)
        if (this.footerScope.showing !== ShowingOptions.ALL) {
            this.updateHint(this.mainScope)
        } else {
            this.updateHint(item)
        }
    }

    protected async onItemEdit(item: ItemScope) {
        for (const otherItem of this.itemScopes) {
            if (otherItem !== item && otherItem.editing) {
                otherItem.editing = false
                // Optional update hint (improve performance)
                this.updateHint(otherItem)
            }
        }

        if (!item.editing) {
            item.editing = true
            // Optional update hint (improve performance)
            this.updateHint(item)
        }
    }

    protected async onItemBlur(item: ItemScope, val: string) {
        this.saveItem(item, val)
    }

    protected async onItemKeyDown(item: ItemScope, code: string, val: string) {
        if (code === 'Escape') {
            this.cancelItem(item)
        } else if (code === 'Enter') {
            this.saveItem(item, val)
        }
    }

    protected async onItemDestroy(item: ItemScope) {
        this.destroy(item)
    }

    protected destroy(item: ItemScope) {
        const itemIdx = this.itemScopes.findIndex(i => i.id === item.id)
        if (itemIdx !== -1) {
            this.itemScopes.splice(itemIdx, 1)
            this.updateHint(this.mainScope)
        }
    }

    protected cancelItem(item: ItemScope) {
        item.editing = false
        this.updateHint(item)
    }

    protected saveItem(item: ItemScope, val: string) {
        const trimVal = val ? val.trim() : ''
        if (trimVal) {
            item.title = trimVal
            item.editing = false
            this.updateHint(item)
        } else {
            this.destroy(item)
        }
    }

    /**
     * This method is a way of showing that calling update is an optional
     * when AutoUpdate is enabled. However, calling the update works like
     * a hint that can lead to beater performance
     * 
     * @param optionalScope reference scope
     */
    public updateHint(optionalScope?: Scope) {
        if (this.updateHintEnabled) {
            this.update(optionalScope)
        }
    }

    /**
     * This action is called just before scope changes be notified
     * to the view. This action has a debounce controller related
     * to the Presenter.update() and with scope.actions. Whenever one
     * of this methods/actions (with autoUpdate) is called, it is 
     * garanteed that this event will be emited
     */
    public override onBeforeScopeUpdate() {
        let baseChanged = false
        let headerChanged = false
        let mainChanged = false
        let footerChanged = false

        let allItemsCompleted = false
        let toggleButtonVisible = false

        let totalNumOfCompletedTask = 0

        if (this.itemScopes.length > 0) {
            let itemCount = 0
            const updateOrAddItem = (itemScope: ItemScope) => {
                const oldItemScope = this.mainScope.items[itemCount]
                if (oldItemScope !== itemScope) {
                    this.mainScope.items[itemCount] = itemScope
                    mainChanged = true
                }
                itemCount++
            }

            let completeCount = 0
            for (const itemScope of this.itemScopes) {
                if (itemScope.completed) {
                    totalNumOfCompletedTask++
                }

                switch (this.footerScope.showing) {
                    case ShowingOptions.ACTIVE:
                        if (!itemScope.completed) {
                            updateOrAddItem(itemScope)
                        }
                        break
                    case ShowingOptions.COMPLETED:
                        if (itemScope.completed) {
                            updateOrAddItem(itemScope)
                            completeCount++
                        }
                        break
                    default:
                        if (itemScope.completed) {
                            completeCount++
                        }
                        updateOrAddItem(itemScope)
                }
            }

            if (this.mainScope.items.length !== itemCount) {
                this.mainScope.items.length = itemCount
                mainChanged = true
            }

            allItemsCompleted = completeCount === this.mainScope.items.length
            toggleButtonVisible = this.mainScope.items.length !== 0
        } else {
            allItemsCompleted = false
            toggleButtonVisible = false

            if (this.mainScope.items.length !== 0) {
                this.mainScope.items.length = 0
                mainChanged = true
            }
        }

        if (allItemsCompleted !== this.headerScope.allItemsCompleted) {
            this.headerScope.allItemsCompleted = allItemsCompleted
            headerChanged = true
        }

        if (this.headerScope.toggleButtonVisible !== toggleButtonVisible) {
            this.headerScope.toggleButtonVisible = toggleButtonVisible
            headerChanged = true
        }

        if (this.mainScope.items.length > 0) {
            if (this.scope.main !== this.mainScope) {
                this.scope.main = this.mainScope
                baseChanged = true
            }
        } else if (this.scope.main) {
            this.scope.main = undefined
            baseChanged = true
        }

        if (this.itemScopes.length > 0) {
            const showClearButton = totalNumOfCompletedTask > 0
            if (this.footerScope.clearButtonVisible !== showClearButton) {
                this.footerScope.clearButtonVisible = showClearButton
                footerChanged = true
            }

            if (this.footerScope.count !== this.mainScope.items.length) {
                this.footerScope.count = this.mainScope.items.length
                if (this.footerScope.count > 1) {
                    this.footerScope.activeTodoWord = 'items'
                } else {
                    this.footerScope.activeTodoWord = 'item'
                }
                footerChanged = true
            }

            if (this.scope.footer != this.footerScope) {
                this.scope.footer = this.footerScope
                baseChanged = true
            }
        } else if (this.scope.footer) {
            this.scope.footer = undefined
            baseChanged = true
        }

        // Optional update hint: this is util to tune performance
        if (this.updateHintEnabled) {
            if (baseChanged) {
                this.update(this.scope)
            } else {
                if (headerChanged) {
                    this.update(this.headerScope)
                }

                if (mainChanged) {
                    this.update(this.mainScope)
                }

                if (footerChanged) {
                    this.update(this.footerScope)
                }
            }
        }
    }

}