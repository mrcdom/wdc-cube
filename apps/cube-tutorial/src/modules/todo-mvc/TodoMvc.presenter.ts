/*
 * Based on https://todomvc.com/examples/react
 */

import { Logger, Presenter, Scope, ScopeSlot, PlaceUri, NOOP_VOID } from 'wdc-cube'
import { TutorialService } from '../../services/TutorialService'
import { MainPresenter } from '../../main/Main.presenter'
import { ParamsIds, AttrsIds } from '../../Constants'

const LOG = Logger.get('TodoMvcPresenter')

// @Inject
const tutorialService = TutorialService.INSTANCE

// :: Scopes

type KeyDownEvent = {
    preventDefault: () => void
    code: string
}

export enum ShowingOptions {
    ALL,
    ACTIVE,
    COMPLETED
}

export class ClockScope extends Scope {
    date = new Date()
}

export class ItemScope extends Scope {
    id = 0
    completed = false
    editing = false
    title = ''

    readonly actions = {
        onDestroy: Scope.ASYNC_ACTION,
        onToggle: Scope.ASYNC_ACTION,
        onEdit: Scope.ASYNC_ACTION,
        onBlur: Scope.SYNC_ACTION as (getValue: () => string) => void,
        onKeyDown: Scope.SYNC_ACTION as (getValue: () => string, event: KeyDownEvent) => void,
    }
}

export class HeaderScope extends Scope {
    allItemsCompleted = false
    toggleButtonVisible = false
    inputValue = ''

    readonly actions = {
        onSyncInputChange: Scope.SYNC_ACTION as (value: string) => void,
        onSyncInputKeyDown: Scope.SYNC_ACTION as (event: KeyDownEvent) => void,
        onToggleAll: Scope.ASYNC_ACTION
    }
}

export class MainScope extends Scope {
    clock?: ClockScope

    items = [] as ItemScope[]
}

export class FooterScope extends Scope {
    count = 0
    activeTodoWord = 'item'
    clearButtonVisible = false
    showing = ShowingOptions.ALL

    readonly actions = {
        onClearCompleted: Scope.ASYNC_ACTION,
        onShowAll: Scope.ASYNC_ACTION,
        onShowActives: Scope.ASYNC_ACTION,
        onShowCompleteds: Scope.ASYNC_ACTION
    }
}

export class TodoMvcScope extends Scope {
    header?: HeaderScope
    main?: MainScope
    footer?: FooterScope
}

// :: Presentation

export class TodoMvcPresenter extends Presenter<MainPresenter, TodoMvcScope> {

    private parentSlot: ScopeSlot = NOOP_VOID

    private headerScope = new HeaderScope()

    private mainScope = new MainScope()

    private clockScope = new ClockScope()

    private footerScope = new FooterScope()

    private itemScopes = [] as ItemScope[]

    private userId = 0

    private updateHintEnabled = true

    private clockUpdateHandler?: NodeJS.Timeout

    public constructor(app: MainPresenter) {
        super(app, new TodoMvcScope())
        this.scope.header = this.headerScope
    }

    public override release() {
        if (this.clockUpdateHandler) {
            clearInterval(this.clockUpdateHandler)
        }
        super.release()
        LOG.debug('Finalized')
    }

    public override async applyParameters(uri: PlaceUri, initialization: boolean): Promise<boolean> {
        const uriUserId = uri.getParameterAsNumberOrDefault(ParamsIds.TodoUserId, this.userId)
        const uriShowing = uri.getParameterAsNumberOrDefault(ParamsIds.TodoShowing, this.footerScope.showing) as ShowingOptions

        if (initialization) {
            await this.initializeState(uri, uriUserId, uriShowing)
        } else {
            await this.synchronizeState(uriUserId, uriShowing)
        }

        this.parentSlot(this.scope)

        return true
    }

    public publishParameters(uri: PlaceUri): void {
        if (this.footerScope.showing !== ShowingOptions.ALL) {
            uri.setParameter(ParamsIds.TodoShowing, this.footerScope.showing)
        }

        if (this.userId !== 0) {
            uri.setParameter(ParamsIds.TodoUserId, this.userId)
        }
    }

    private async initializeState(uri: PlaceUri, uriUserId: number, uriShowing: ShowingOptions) {
        this.userId = uriUserId

        // Bind Events
        this.headerScope.actions.onSyncInputChange = this.onHeaderSyncInputChange.bind(this)
        this.headerScope.actions.onSyncInputKeyDown = this.onHeaderSyncInputKeyDown.bind(this)
        this.headerScope.actions.onToggleAll = this.onToggleAll.bind(this)

        this.footerScope.actions.onClearCompleted = this.onClearCompleted.bind(this)
        this.footerScope.actions.onShowAll = this.onShowAll.bind(this)
        this.footerScope.actions.onShowActives = this.onShowActives.bind(this)
        this.footerScope.actions.onShowCompleteds = this.onShowCompleteds.bind(this)

        this.footerScope.showing = uriShowing

        // Configure fallback scope that must be used when there were
        // to many small updates
        this.configureUpdate(ItemScope, 10, this.mainScope) // TODO inverter ordem parametro

        // Get slots
        this.parentSlot = uri.getScopeSlot(AttrsIds.parentSlot)

        if (this.userId < 0) {
            this.mainScope.clock = this.clockScope
            this.clockUpdateHandler = setInterval(this.handleClockUpdate.bind(this), 1000)
        }

        await this.loadData()

        LOG.debug('Initialized')
    }

    private async synchronizeState(uriUserId: number, uriShowing: ShowingOptions) {
        this.footerScope.showing = uriShowing

        if (uriUserId !== this.userId) {
            this.userId = uriUserId
            await this.loadData()
        }
    }

    private async loadData() {
        const todos = await tutorialService.fetchTodos(this.userId)

        this.itemScopes.length = 0

        for (const todo of todos) {
            const todoScope = new ItemScope()
            todoScope.id = todo.id
            todoScope.title = todo.title
            todoScope.completed = todo.completed
            this.bindItemScopeActions(todoScope)
            this.itemScopes.push(todoScope)
        }

        if (this.userId < 0) {
            this.mainScope.clock = this.clockScope
            if (!this.clockUpdateHandler) {
                this.clockUpdateHandler = setInterval(this.handleClockUpdate.bind(this), 1000)
            }
        } else {
            this.mainScope.clock = undefined
            if (this.clockUpdateHandler) {
                clearInterval(this.clockUpdateHandler)
            }
        }

        this.update()
    }

    private bindItemScopeActions(item: ItemScope) {
        item.actions.onToggle = this.onItemToggle.bind(this, item)
        item.actions.onEdit = this.onItemEdit.bind(this, item)
        item.actions.onKeyDown = this.onItemKeyDown.bind(this, item)
        item.actions.onBlur = this.onItemBlur.bind(this, item)
        item.actions.onDestroy = this.onItemDestroy.bind(this, item)
    }

    protected async handleClockUpdate() {
        this.clockScope.date = new Date()
        this.update(this.mainScope.clock)
    }

    protected onHeaderSyncInputChange(value: string) {
        if (value !== this.headerScope.inputValue) {
            this.headerScope.inputValue = value
            this.update(this.headerScope)
        }
    }

    protected onHeaderSyncInputKeyDown(event: KeyDownEvent) {
        const oldValue = this.headerScope.inputValue
        try {
            if (event.code === 'Escape') {
                this.headerScope.inputValue = ''
                return
            }

            if (event.code !== 'Enter') {
                return
            }

            event.preventDefault()

            const trimVal = this.headerScope.inputValue.trim()

            this.headerScope.inputValue = ''

            if (trimVal) {
                const lastUid = this.itemScopes.reduce((accum, todo) => Math.max(todo.id, accum), 0)

                const todoScope = new ItemScope()
                todoScope.id = lastUid + 1
                todoScope.title = trimVal
                todoScope.completed = false
                this.bindItemScopeActions(todoScope)
                this.itemScopes.push(todoScope)

                this.updateHint(this.mainScope)
            }
        } finally {
            if (this.headerScope.inputValue !== oldValue) {
                this.update(this.headerScope)
            }
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
                this.update(itemScope)
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

    protected async onItemBlur(item: ItemScope, getValue: () => string) {
        this.saveItem(item, getValue())
    }

    protected async onItemKeyDown(item: ItemScope, getValue: () => string, event: KeyDownEvent) {
        if (event.code === 'Escape') {
            this.cancelItem(item)
        } else if (event.code === 'Enter') {
            this.saveItem(item, getValue())
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
                this.update()
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