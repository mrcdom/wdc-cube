/*
 * Based on https://todomvc.com/examples/react
 */

import { Logger, Presenter, CubePresenter, Scope, ScopeSlot, PlaceUri, action, NOOP_VOID } from 'wdc-cube'
import { TutorialService } from '../../services/TutorialService'
import { MainPresenter } from '../../main/Main.presenter'
import { ParamIds, AttrIds } from '../../Constants'

import { types, Instance, onSnapshot, IDisposer } from 'mobx-state-tree'

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

const HeaderMobX = types
    .model({
        allItemsCompleted: false,
        toggleButtonVisible: false,
        inputValue: ''
    })
    .actions(state => ({

        setAllItemsCompleted(value: boolean) {
            state.allItemsCompleted = value
        },

        setToggleButtonVisible(value: boolean) {
            state.toggleButtonVisible = value
        },

        setInputValue(value: string) {
            state.inputValue = value
        }

    }))

export class HeaderScope extends Scope {

    private model: Instance<typeof HeaderMobX>

    get allItemsCompleted(): boolean {
        return this.model.allItemsCompleted
    }

    set allItemsCompleted(value: boolean) {
        this.model.setAllItemsCompleted(value)
    }

    get toggleButtonVisible(): boolean {
        return this.model.toggleButtonVisible
    }

    set toggleButtonVisible(value: boolean) {
        this.model.setToggleButtonVisible(value)
    }

    get inputValue(): string {
        return this.model.inputValue
    }

    set inputValue(value: string) {
        this.model.setInputValue(value)
    }

    constructor() {
        super()
        this.model = HeaderMobX.create()
    }

    observe(callback: () => void) {
        return onSnapshot(this.model, callback)
    }

    readonly actions = {
        onSyncInputChange: Scope.SYNC_ACTION as (value: string) => void,
        onSyncInputKeyDown: Scope.SYNC_ACTION as (event: KeyDownEvent) => void,
        onToggleAll: Scope.ASYNC_ACTION
    }
}

class HeaderPresenter extends Presenter<HeaderScope> {

    public handleEnter = Scope.SYNC_ACTION_STRING

    public handleToggleAll = Scope.ASYNC_ACTION

    private _observerDisposer: IDisposer

    public constructor(app: MainPresenter) {
        super(app, new HeaderScope())
        this._observerDisposer = this.scope.observe(() => this.update())
    }

    public release() {
        this._observerDisposer()
        super.release()
    }

    public initialize() {
        this.scope.actions.onSyncInputChange = this.onSyncInputChange.bind(this)
        this.scope.actions.onSyncInputKeyDown = this.onSyncInputKeyDown.bind(this)
        this.scope.actions.onToggleAll = this.handleToggleAll
    }

    protected onSyncInputChange(value: string) {
        this.scope.inputValue = value
    }

    protected onSyncInputKeyDown(event: KeyDownEvent) {
        if (event.code === 'Escape') {
            this.scope.inputValue = ''
            return
        }

        if (event.code !== 'Enter') {
            return
        }

        event.preventDefault()

        const trimVal = this.scope.inputValue.trim()

        this.scope.inputValue = ''

        if (trimVal) {
            this.handleEnter(trimVal)
        }
    }
}

export class TodoMvcPresenter extends CubePresenter<MainPresenter, TodoMvcScope> {

    private parentSlot: ScopeSlot = NOOP_VOID

    private header: HeaderPresenter

    private mainScope = new MainScope()

    private clockScope = new ClockScope()

    private footerScope = new FooterScope()

    private itemScopes = [] as ItemScope[]

    private userId = 0

    private updateHintEnabled = true

    private clockUpdateHandler?: NodeJS.Timeout

    public constructor(app: MainPresenter) {
        super(app, new TodoMvcScope())
        this.header = new HeaderPresenter(app)
        this.scope.header = this.header.scope
    }

    public override release() {
        if (this.clockUpdateHandler) {
            clearInterval(this.clockUpdateHandler)
        }

        this.header.release()

        super.release()
        LOG.debug('Finalized')
    }

    public override async applyParameters(uri: PlaceUri, initialization: boolean): Promise<boolean> {
        const uriUserId = uri.getParameterAsNumberOrDefault(ParamIds.TodoUserId, this.userId)
        const uriShowing = uri.getParameterAsNumberOrDefault(ParamIds.TodoShowing, this.footerScope.showing) as ShowingOptions

        if (initialization) {
            await this.initializeState(uri, uriUserId, uriShowing)
        } else {
            await this.synchronizeState(uriUserId, uriShowing)
        }

        this.parentSlot(this.scope)

        return true
    }

    public override publishParameters(uri: PlaceUri): void {
        if (this.footerScope.showing !== ShowingOptions.ALL) {
            uri.setParameter(ParamIds.TodoShowing, this.footerScope.showing)
        }

        if (this.userId !== 0) {
            uri.setParameter(ParamIds.TodoUserId, this.userId)
        }
    }

    private async initializeState(uri: PlaceUri, uriUserId: number, uriShowing: ShowingOptions) {
        // Bind Events
        this.header.handleEnter = this.onAddItem.bind(this)
        this.header.handleToggleAll = this.onToggleAll.bind(this)
        this.header.initialize()

        this.footerScope.actions.onClearCompleted = this.onClearCompleted.bind(this)
        this.footerScope.actions.onShowAll = this.onShowAll.bind(this)
        this.footerScope.actions.onShowActives = this.onShowActives.bind(this)
        this.footerScope.actions.onShowCompleteds = this.onShowCompleteds.bind(this)

        // Hints given to presenter update debounce controller
        this.updateManager.hint(ItemScope, this.mainScope, 10)

        // Get slots
        this.parentSlot = uri.getScopeSlot(AttrIds.parentSlot)

        await this.synchronizeState(uriUserId, uriShowing, true)

        LOG.debug('Initialized')
    }

    private async synchronizeState(uriUserId: number, uriShowing: ShowingOptions, force = false) {
        if (this.footerScope.showing != uriShowing) {
            this.footerScope.showing = uriShowing
            this.update(this.footerScope)
        }

        if (force || uriUserId !== this.userId) {
            this.userId = uriUserId

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

            await this.loadData()
            this.update(this.mainScope)
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

    @action()
    protected onAddItem(value: string) {
        const lastUid = this.itemScopes.reduce((accum, todo) => Math.max(todo.id, accum), 0)

        const todoScope = new ItemScope()
        todoScope.id = lastUid + 1
        todoScope.title = value
        todoScope.completed = false
        this.bindItemScopeActions(todoScope)
        this.itemScopes.push(todoScope)

        this.optionalUpdateHint(this.mainScope)
    }

    @action()
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

    @action()
    protected async onClearCompleted() {
        this.itemScopes = this.itemScopes.filter(item => !item.completed)
        this.optionalUpdateHint(this.mainScope)
    }

    @action()
    protected async onShowAll() {
        this.footerScope.showing = ShowingOptions.ALL
        this.optionalUpdateHint(this.footerScope)
        this.updateHistory()
    }

    @action()
    protected async onShowActives() {
        this.footerScope.showing = ShowingOptions.ACTIVE
        this.optionalUpdateHint(this.footerScope)
        this.updateHistory()
    }

    @action()
    protected async onShowCompleteds() {
        this.footerScope.showing = ShowingOptions.COMPLETED
        this.optionalUpdateHint(this.footerScope)
        this.updateHistory()
    }

    @action()
    protected async onItemToggle(item: ItemScope) {
        item.completed = !item.completed

        // Optional update hint (improve performance)
        if (this.footerScope.showing !== ShowingOptions.ALL) {
            this.optionalUpdateHint(this.mainScope)
        } else {
            this.optionalUpdateHint(item)
        }
    }

    @action()
    protected async onItemEdit(item: ItemScope) {
        for (const otherItem of this.itemScopes) {
            if (otherItem !== item && otherItem.editing) {
                otherItem.editing = false
                // Optional update hint (improve performance)
                this.optionalUpdateHint(otherItem)
            }
        }

        if (!item.editing) {
            item.editing = true
            // Optional update hint (improve performance)
            this.optionalUpdateHint(item)
        }
    }

    @action()
    protected async onItemBlur(item: ItemScope, getValue: () => string) {
        this.saveItem(item, getValue())
    }

    @action()
    protected async onItemKeyDown(item: ItemScope, getValue: () => string, event: KeyDownEvent) {
        if (event.code === 'Escape') {
            this.cancelItem(item)
        } else if (event.code === 'Enter') {
            this.saveItem(item, getValue())
        }
    }

    @action()
    protected async onItemDestroy(item: ItemScope) {
        this.destroy(item)
    }

    protected destroy(item: ItemScope) {
        const itemIdx = this.itemScopes.findIndex(i => i.id === item.id)
        if (itemIdx !== -1) {
            this.itemScopes.splice(itemIdx, 1)
            this.optionalUpdateHint(this.mainScope)
        }
    }

    protected cancelItem(item: ItemScope) {
        item.editing = false
        this.optionalUpdateHint(item)
    }

    protected saveItem(item: ItemScope, val: string) {
        const trimVal = val ? val.trim() : ''
        if (trimVal) {
            item.title = trimVal
            item.editing = false
            this.optionalUpdateHint(item)
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
    public optionalUpdateHint(optionalScope?: Scope) {
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

        if (allItemsCompleted !== this.header.scope.allItemsCompleted) {
            this.header.scope.allItemsCompleted = allItemsCompleted
            headerChanged = true
        }

        if (this.header.scope.toggleButtonVisible !== toggleButtonVisible) {
            this.header.scope.toggleButtonVisible = toggleButtonVisible
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
                    this.update(this.header.scope)
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