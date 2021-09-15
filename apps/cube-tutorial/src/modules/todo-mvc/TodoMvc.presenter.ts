/*
 * Based on https://todomvc.com/examples/react
 */

import { Logger, Presenter, Scope, ScopeSlot, PlaceUri, ChangeMonitor, NOOP_VOID } from 'wdc-cube'
import { v4 as uuidv4 } from 'uuid'
import { TutorialService } from '../../services/TutorialService'
import { MainPresenter } from '../../main/Main.presenter'
import { ViewIds, ParamsIds, AttrsIds } from '../../Constants'

const LOG = Logger.get('TodoMvcPresenter')

// @Inject
const changeMonitor = ChangeMonitor.INSTANCE

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

    onToggleAll = Scope.ACTION()
    onAddTodo = Scope.ACTION1<string>()
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

    onClearCompleted = Scope.ACTION()
    onShowAll = Scope.ACTION()
    onShowActives = Scope.ACTION()
    onShowCompleteds = Scope.ACTION()
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

    private usingMonitor = false

    public constructor(app: MainPresenter) {
        super(app, new TodoMvcScope())
        this.scope.header = this.headerScope
    }

    public override release() {
        changeMonitor.unbind(this)
        super.release()
        LOG.info('Finalized')
    }

    public override async applyParameters(uri: PlaceUri, initialization: boolean): Promise<boolean> {
        const uriShowing = uri.getParameterAsNumberOrDefault(ParamsIds.TodoShowing, this.footerScope.showing) as ShowingOptions

        if (initialization) {
            // Bind Events
            this.headerScope.onAddTodo = this.onAddTodo.bind(this)
            this.headerScope.onToggleAll = this.onToggleAll.bind(this)
            this.footerScope.onClearCompleted = this.onClearCompleted.bind(this)
            this.footerScope.onShowAll = this.onShowAll.bind(this)
            this.footerScope.onShowActives = this.onShowActives.bind(this)
            this.footerScope.onShowCompleteds = this.onShowCompleteds.bind(this)

            // Get slots
            this.parentSlot = uri.getScopeSlot(AttrsIds.parentSlot)

            this.footerScope.showing = uriShowing
            // Load and prepare data
            await this.loadData()

            //this.usingMonitor = changeMonitor.bind(this, true)
            //if(!this.usingMonitor) {
            //    this.enableApply()
            //}

            LOG.info('Initialized')
        } else if(uriShowing !== this.footerScope.showing) {
            this.footerScope.showing = uriShowing
            this.$apply(this.footerScope)
        }

        this.parentSlot(this.scope)

        return true
    }

    public publishParameters(uri: PlaceUri): void {
        if (this.footerScope.showing !== ShowingOptions.ALL) {
            uri.setParameter(ParamsIds.TodoShowing, this.footerScope.showing)
        }
    }

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

        // Apply view changes

        if (baseChanged) {
            this.$apply(this.scope)
        } else {
            if (headerChanged) {
                this.$apply(this.headerScope)
            }

            if (mainChanged) {
                this.$apply(this.mainScope)
            }

            if (footerChanged) {
                this.$apply(this.footerScope)
            }
        }
    }

    private async loadData() {
        this.itemScopes.length = 0
        try {
            const todos = await tutorialService.fetchTodos()
            for (const todo of todos) {
                const todoScope = new ItemScope()
                todoScope.id = todo.uid
                todoScope.title = todo.text
                todoScope.completed = todo.complete
                this.bindItemScope(todoScope)
                this.itemScopes.push(todoScope)
            }
        } finally {
            this.$apply()
        }
    }

    protected async onAddTodo(val: string) {
        const lastUid = this.itemScopes.reduce((accum, todo) => Math.max(todo.id, accum), 0)

        const todoScope = new ItemScope()
        todoScope.id = lastUid + 1
        todoScope.title = val
        todoScope.completed = false
        this.bindItemScope(todoScope)
        this.itemScopes.push(todoScope)

        if (this.footerScope.showing !== ShowingOptions.COMPLETED) {
            this.mainScope.items.push(todoScope)
            this.$apply()
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

        let numChanges = 0
        for (const itemScope of this.itemScopes) {
            if (itemScope.completed !== checked) {
                itemScope.completed = checked
                numChanges++
            }
        }

        if (numChanges > 0) {
            this.$apply(this.mainScope)
        }
    }

    protected async onClearCompleted() {
        this.itemScopes = this.itemScopes.filter(item => !item.completed)
        this.$apply(this.mainScope)
    }

    protected async onShowAll() {
        if (this.footerScope.showing !== ShowingOptions.ALL) {
            this.footerScope.showing = ShowingOptions.ALL
            this.$apply(this.footerScope)
            this.app.updateHistory()
        }
    }

    protected async onShowActives() {
        if (this.footerScope.showing !== ShowingOptions.ACTIVE) {
            this.footerScope.showing = ShowingOptions.ACTIVE
            this.$apply(this.footerScope)
            this.app.updateHistory()
        }
    }

    protected async onShowCompleteds() {
        if (this.footerScope.showing !== ShowingOptions.COMPLETED) {
            this.footerScope.showing = ShowingOptions.COMPLETED
            this.$apply(this.footerScope)
            this.app.updateHistory()
        }
    }

    private bindItemScope(item: ItemScope) {
        item.actions.onToggle = this.onItemToggle.bind(this, item)
        item.actions.onEdit = this.onItemEdit.bind(this, item)
        item.actions.onKeyDown = this.onItemKeyDown.bind(this, item)
        item.actions.onBlur = this.onItemBlur.bind(this, item)
        item.actions.onDestroy = this.onItemDestroy.bind(this, item)
    }

    protected async onItemToggle(item: ItemScope) {
        item.completed = !item.completed

        if (this.footerScope.showing !== ShowingOptions.ALL) {
            this.$apply(this.mainScope)
        } else {
            this.$apply(item)
        }
    }

    protected async onItemEdit(item: ItemScope) {
        for (const otherItem of this.itemScopes) {
            if (otherItem !== item && otherItem.editing) {
                otherItem.editing = false
                this.$apply(otherItem)
            }
        }

        if (!item.editing) {
            item.editing = true
            this.$apply(item)
        }
    }

    protected async onItemBlur(item: ItemScope, val: string) {
        const trimVal = val.trim()
        if (trimVal) {
            this.saveItem(item, trimVal)
        } else {
            await this.onItemDestroy(item)
        }
    }

    protected async onItemKeyDown(item: ItemScope, code: string, val: string) {
        if (code === 'Escape') {
            this.cancelItem(item)
        } else if (code === 'Enter') {
            await this.onItemBlur(item, val.trim())
        }
    }

    protected async onItemDestroy(item: ItemScope) {
        const itemIdx = this.itemScopes.findIndex(i => i.id === item.id)
        if (itemIdx !== -1) {
            this.itemScopes.splice(itemIdx, 1)
        }

        this.$apply(this.mainScope)
    }

    protected cancelItem(item: ItemScope) {
        item.editing = false
        this.$apply(item)
    }

    protected saveItem(item: ItemScope, val: string) {
        item.title = val
        item.editing = false
        this.$apply(item)
    }

    private $apply<T extends Scope>(optionalScope?: T): void {
        if (!this.usingMonitor) {
            //const scope = optionalScope ?? this.scope
            //console.log(scope.vid)
            super.update(optionalScope)
            //super.apply(true)
        }
    }
}