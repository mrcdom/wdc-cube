/*
 * Based on https://todomvc.com/examples/react
 */

import { Logger, CubePresenter, Scope, ScopeSlot, PlaceUri, action, observable, ObservableArray, NOOP_VOID } from 'wdc-cube'
import { TutorialService } from '../../services/TutorialService'
import { MainPresenter } from '../../main/Main.presenter'
import { ParamIds, AttrIds } from '../../Constants'

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

export class HeaderScope extends Scope {
    readonly allItemsCompleted = observable.value(this, false)
    readonly toggleButtonVisible = observable.value(this, false)
    readonly inputValue = observable.value(this, '')

    readonly actions = {
        onSyncInputChange: Scope.SYNC_ACTION as (value: string) => void,
        onSyncInputKeyDown: Scope.SYNC_ACTION as (event: KeyDownEvent) => void,
        onToggleAll: Scope.ASYNC_ACTION
    }
}

export class ClockScope extends Scope {
    readonly date = observable.value(this, new Date())
}

export class ItemScope extends Scope {
    readonly id = observable.value(this, 0)
    readonly completed = observable.value(this, false)
    readonly editing = observable.value(this, false)
    readonly title = observable.value(this, '')

    readonly actions = {
        onDestroy: Scope.ASYNC_ACTION,
        onToggle: Scope.ASYNC_ACTION,
        onEdit: Scope.ASYNC_ACTION,
        onBlur: Scope.SYNC_ACTION as (getValue: () => string) => void,
        onKeyDown: Scope.SYNC_ACTION as (getValue: () => string, event: KeyDownEvent) => void,
    }

}

export class MainScope extends Scope {
    readonly clock = observable.optional<ClockScope>(this)
    readonly items = observable.array<ItemScope>(this)
}

export class FooterScope extends Scope {
    readonly count = observable.value(this, 0)
    readonly activeTodoWord = observable.value(this, 'item')
    readonly clearButtonVisible = observable.value(this, false)
    readonly showing = observable.value(this, ShowingOptions.ALL)

    readonly actions = {
        onClearCompleted: Scope.ASYNC_ACTION,
        onShowAll: Scope.ASYNC_ACTION,
        onShowActives: Scope.ASYNC_ACTION,
        onShowCompleteds: Scope.ASYNC_ACTION
    }
}

export class TodoMvcScope extends Scope {
    readonly header = observable.optional<HeaderScope>(this)
    readonly main = observable.optional<MainScope>(this)
    readonly footer = observable.optional<FooterScope>(this)
}

// :: Presentation

export class TodoMvcPresenter extends CubePresenter<MainPresenter, TodoMvcScope> {

    private parentSlot: ScopeSlot = NOOP_VOID

    private readonly headerScope = new HeaderScope()

    private readonly mainScope = new MainScope()

    private readonly clockScope = new ClockScope()

    private readonly footerScope = new FooterScope()

    private readonly itemScopes: ObservableArray<ItemScope>

    private userId = 0

    private clockUpdateHandler?: NodeJS.Timeout

    public constructor(app: MainPresenter) {
        super(app, new TodoMvcScope())

        this.itemScopes = observable.array<ItemScope>(this.mainScope)

        // Bind Events
        this.headerScope.actions.onSyncInputChange = this.onHeaderSyncInputChange.bind(this)
        this.headerScope.actions.onSyncInputKeyDown = this.onHeaderSyncInputKeyDown.bind(this)
        this.headerScope.actions.onToggleAll = this.onToggleAll.bind(this)

        this.footerScope.actions.onClearCompleted = this.onClearCompleted.bind(this)
        this.footerScope.actions.onShowAll = this.onShowAll.bind(this)
        this.footerScope.actions.onShowActives = this.onShowActives.bind(this)
        this.footerScope.actions.onShowCompleteds = this.onShowCompleteds.bind(this)

        this.headerScope.update = this.update
        this.mainScope.update = this.update
        this.footerScope.update = this.update
        this.clockScope.update = this.update

        this.scope.header(this.headerScope)

        // Hints given to presenter update debounce controller
        this.updateManager.hint(ItemScope, this.mainScope, 10)
    }

    public override release() {
        if (this.clockUpdateHandler) {
            clearInterval(this.clockUpdateHandler)
        }

        super.release()
        LOG.debug('Finalized')
    }

    public override async applyParameters(uri: PlaceUri, initialization: boolean): Promise<boolean> {
        const uriUserId = uri.getParameterAsNumberOrDefault(ParamIds.TodoUserId, this.userId)
        const uriShowing = uri.getParameterAsNumberOrDefault(ParamIds.TodoShowing, this.footerScope.showing()) as ShowingOptions

        if (initialization) {
            await this.initializeState(uri, uriUserId, uriShowing)
        } else {
            await this.synchronizeState(uriUserId, uriShowing)
        }

        this.parentSlot(this.scope)

        return true
    }

    public override publishParameters(uri: PlaceUri): void {
        if (this.footerScope.showing() !== ShowingOptions.ALL) {
            uri.setParameter(ParamIds.TodoShowing, this.footerScope.showing())
        }

        if (this.userId !== 0) {
            uri.setParameter(ParamIds.TodoUserId, this.userId)
        }
    }

    private async initializeState(uri: PlaceUri, uriUserId: number, uriShowing: ShowingOptions) {
        // Get slots
        this.parentSlot = uri.getScopeSlot(AttrIds.parentSlot)

        await this.synchronizeState(uriUserId, uriShowing, true)

        LOG.debug('Initialized')
    }

    private async synchronizeState(uriUserId: number, uriShowing: ShowingOptions, force = false) {
        this.footerScope.showing(uriShowing)

        if (force || uriUserId !== this.userId) {
            this.userId = uriUserId

            if (this.userId < 0) {
                this.mainScope.clock(this.clockScope)
                if (!this.clockUpdateHandler) {
                    this.clockUpdateHandler = setInterval(this.handleClockUpdate.bind(this), 1000)
                }
            } else {
                this.mainScope.clock(undefined)
                if (this.clockUpdateHandler) {
                    clearInterval(this.clockUpdateHandler)
                }
            }

            await this.loadData()
        }
    }

    private async loadData() {
        const todos = await tutorialService.fetchTodos(this.userId)

        this.itemScopes.length = 0

        for (const todo of todos) {
            const todoScope = new ItemScope()
            todoScope.id(todo.id)
            todoScope.title(todo.title)
            todoScope.completed(todo.completed)
            this.bindItemScopeActions(todoScope)
            this.itemScopes.push(todoScope)
        }
    }

    private bindItemScopeActions(item: ItemScope) {
        item.update = this.update
        item.actions.onToggle = this.onItemToggle.bind(this, item)
        item.actions.onEdit = this.onItemEdit.bind(this, item)
        item.actions.onKeyDown = this.onItemKeyDown.bind(this, item)
        item.actions.onBlur = this.onItemBlur.bind(this, item)
        item.actions.onDestroy = this.onItemDestroy.bind(this, item)
    }

    protected async handleClockUpdate() {
        this.clockScope.date(new Date())
    }

    protected onHeaderSyncInputChange(value: string) {
        this.headerScope.inputValue(value)
    }

    protected onHeaderSyncInputKeyDown(event: KeyDownEvent) {
        if (event.code === 'Escape') {
            this.headerScope.inputValue('')
            return
        }

        if (event.code !== 'Enter') {
            return
        }

        event.preventDefault()

        const trimVal = this.headerScope.inputValue().trim()

        this.headerScope.inputValue('')

        if (trimVal) {
            this.onAddItem(trimVal)
        }
    }

    @action()
    protected onAddItem(value: string) {
        const lastUid = this.itemScopes.reduce((accum, todo) => Math.max(todo.id(), accum), 0)

        const todoScope = new ItemScope()
        todoScope.id(lastUid + 1)
        todoScope.title(value)
        todoScope.completed(false)
        this.bindItemScopeActions(todoScope)
        this.itemScopes.push(todoScope)
    }

    @action()
    protected async onToggleAll() {
        let numOfCompletedTasks = 0
        for (const itemScope of this.itemScopes) {
            if (itemScope.completed()) {
                numOfCompletedTasks++
            }
        }

        const checked = numOfCompletedTasks !== this.mainScope.items.length

        for (const itemScope of this.itemScopes) {
            itemScope.completed(checked)
        }
    }

    @action()
    protected async onClearCompleted() {
        this.itemScopes.removeByCriteria(item => !item.completed())
    }

    @action()
    protected async onShowAll() {
        this.footerScope.showing(ShowingOptions.ALL)
        this.updateHistory()
    }

    @action()
    protected async onShowActives() {
        this.footerScope.showing(ShowingOptions.ACTIVE)
        this.updateHistory()
    }

    @action()
    protected async onShowCompleteds() {
        this.footerScope.showing(ShowingOptions.COMPLETED)
        this.updateHistory()
    }

    @action()
    protected async onItemToggle(item: ItemScope) {
        item.completed(!item.completed())
    }

    @action()
    protected async onItemEdit(item: ItemScope) {
        for (const otherItem of this.itemScopes) {
            if (otherItem !== item) {
                otherItem.editing(false)
            }
        }

        item.editing(true)
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
        const itemIdx = this.itemScopes.findIndex(i => i.id() === item.id())
        if (itemIdx !== -1) {
            this.itemScopes.removeByIndex(itemIdx)
        }
    }

    protected cancelItem(item: ItemScope) {
        item.editing(false)
    }

    protected saveItem(item: ItemScope, val: string) {
        const trimVal = val ? val.trim() : ''
        if (trimVal) {
            item.title(trimVal)
            item.editing(false)
        } else {
            this.destroy(item)
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
        let numCompletedTasks = 0
        let numPendingTasks = 0

        if (this.itemScopes.length > 0) {
            let numItems = 0
            const updateOrAddItem = (itemScope: ItemScope) => {
                this.mainScope.items.set(numItems++, itemScope)
            }

            for (const itemScope of this.itemScopes) {
                if (itemScope.completed()) {
                    numCompletedTasks++
                } else {
                    numPendingTasks++
                }

                switch (this.footerScope.showing()) {
                    case ShowingOptions.ACTIVE:
                        if (!itemScope.completed()) {
                            updateOrAddItem(itemScope)
                        }
                        break
                    case ShowingOptions.COMPLETED:
                        if (itemScope.completed()) {
                            updateOrAddItem(itemScope)
                        }
                        break
                    default:
                        updateOrAddItem(itemScope)
                }
            }

            this.mainScope.items.length = numItems
        }

        if (numCompletedTasks > 0 || numPendingTasks > 0) {
            this.headerScope.allItemsCompleted(numPendingTasks === 0)
            this.headerScope.toggleButtonVisible(true)

            this.footerScope.count(numPendingTasks)
            this.footerScope.activeTodoWord(numPendingTasks > 1 ? 'items' : 'item')
            this.footerScope.clearButtonVisible(numCompletedTasks > 0)

            if (this.mainScope.clock() || this.mainScope.items.length > 0) {
                this.scope.main(this.mainScope)
            } else {
                this.scope.main(undefined)
            }

            this.scope.footer(this.footerScope)
        } else {
            this.headerScope.allItemsCompleted(false)
            this.headerScope.toggleButtonVisible(false)
            this.footerScope.count(0)
            this.footerScope.clearButtonVisible(false)
            this.mainScope.items.length = 0
            this.scope.main(this.mainScope.clock() ? this.mainScope : undefined)
            this.scope.footer(undefined)
        }
    }

}