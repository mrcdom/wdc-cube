/*
 * Based on https://todomvc.com/examples/react
 */

import { Logger, CubePresenter, Scope, ScopeSlot, PlaceUri, action, NOOP_VOID } from 'wdc-cube'
import { TutorialService } from '../../services/TutorialService'
import { MainPresenter } from '../../main/Main.presenter'
import { ParamIds, AttrIds } from '../../Constants'
import { ObservableArray } from '../../cube/ObservableArray'

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

    private __date = new Date()

    get date() {
        return this.__date
    }

    set date(value: Date) {
        if (this.__date !== value) {
            this.__date = value
            this.update(this)
        }
    }

}

export class ItemScope extends Scope {
    private __id = 0
    private __completed = false
    private __editing = false
    private __title = ''

    get id() {
        return this.__id
    }

    set id(value: number) {
        if (this.__id !== value) {
            this.__id = value
            this.update(this)
        }
    }

    get completed() {
        return this.__completed
    }

    set completed(value: boolean) {
        if (this.__completed !== value) {
            this.__completed = value
            this.update(this)
        }
    }

    get editing() {
        return this.__editing
    }

    set editing(value: boolean) {
        if (this.__editing !== value) {
            this.__editing = value
            this.update(this)
        }
    }

    get title() {
        return this.__title
    }

    set title(value: string) {
        if (this.__title !== value) {
            this.__title = value
            this.update(this)
        }
    }

    readonly actions = {
        onDestroy: Scope.ASYNC_ACTION,
        onToggle: Scope.ASYNC_ACTION,
        onEdit: Scope.ASYNC_ACTION,
        onBlur: Scope.SYNC_ACTION as (getValue: () => string) => void,
        onKeyDown: Scope.SYNC_ACTION as (getValue: () => string, event: KeyDownEvent) => void,
    }
}

export class MainScope extends Scope {

    private __clock?: ClockScope

    get clock() {
        return this.__clock
    }

    set clock(value: ClockScope | undefined) {
        if (this.__clock !== value) {
            this.__clock = value
            this.update(this)
        }
    }

    readonly items = new ObservableArray<ItemScope>(this)
}

export class FooterScope extends Scope {

    private __count = 0
    private __activeTodoWord = 'item'
    private __clearButtonVisible = false
    private __showing = ShowingOptions.ALL

    get count() {
        return this.__count
    }

    set count(value: number) {
        if (value !== this.__count) {
            this.__count = value
            this.update(this)
        }
    }

    get activeTodoWord() {
        return this.__activeTodoWord
    }

    set activeTodoWord(value: string) {
        if (value !== this.__activeTodoWord) {
            this.__activeTodoWord = value
            this.update(this)
        }
    }

    get clearButtonVisible() {
        return this.__clearButtonVisible
    }

    set clearButtonVisible(value: boolean) {
        if (this.__clearButtonVisible !== value) {
            this.__clearButtonVisible = value
            this.update(this)
        }
    }

    get showing() {
        return this.__showing
    }

    set showing(value: ShowingOptions) {
        if (this.__showing !== value) {
            this.__showing = value
            this.update(this)
        }
    }

    readonly actions = {
        onClearCompleted: Scope.ASYNC_ACTION,
        onShowAll: Scope.ASYNC_ACTION,
        onShowActives: Scope.ASYNC_ACTION,
        onShowCompleteds: Scope.ASYNC_ACTION
    }
}

export class TodoMvcScope extends Scope {
    private __header?: HeaderScope
    private __main?: MainScope
    private __footer?: FooterScope

    get header() {
        return this.__header
    }

    set header(value: HeaderScope | undefined) {
        if (this.__header !== value) {
            this.__header = value
            this.update(this)
        }
    }

    get main() {
        return this.__main
    }

    set main(value: MainScope | undefined) {
        if (this.__main !== value) {
            this.__main = value
            this.update(this)
        }
    }

    get footer() {
        return this.__footer
    }

    set footer(value: FooterScope | undefined) {
        if (this.__footer !== value) {
            this.__footer = value
            this.update(this)
        }
    }

}

// :: Presentation

export class HeaderScope extends Scope {

    private __allItemsCompleted = false
    private __toggleButtonVisible = false
    private __inputValue = ''

    get allItemsCompleted() {
        return this.__allItemsCompleted
    }

    set allItemsCompleted(value: boolean) {
        if (this.__allItemsCompleted !== value) {
            this.__allItemsCompleted = value
            this.update(this)
        }
    }

    get toggleButtonVisible() {
        return this.__toggleButtonVisible
    }

    set toggleButtonVisible(value: boolean) {
        if (this.__toggleButtonVisible !== value) {
            this.__toggleButtonVisible = value
            this.update(this)
        }
    }

    get inputValue() {
        return this.__inputValue
    }

    set inputValue(value: string) {
        if (this.__inputValue !== value) {
            this.__inputValue = value
            this.update(this)
        }
    }

    readonly actions = {
        onSyncInputChange: Scope.SYNC_ACTION as (value: string) => void,
        onSyncInputKeyDown: Scope.SYNC_ACTION as (event: KeyDownEvent) => void,
        onToggleAll: Scope.ASYNC_ACTION
    }
}

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
        this.headerScope.update = this.scope.update
        this.mainScope.update = this.scope.update
        this.footerScope.update = this.scope.update
        this.clockScope.update = this.scope.update

        this.itemScopes = new ObservableArray<ItemScope>(this.mainScope)

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
        this.headerScope.actions.onSyncInputChange = this.onHeaderSyncInputChange.bind(this)
        this.headerScope.actions.onSyncInputKeyDown = this.onHeaderSyncInputKeyDown.bind(this)
        this.headerScope.actions.onToggleAll = this.onToggleAll.bind(this)

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
        item.update = this.scope.update
        item.actions.onToggle = this.onItemToggle.bind(this, item)
        item.actions.onEdit = this.onItemEdit.bind(this, item)
        item.actions.onKeyDown = this.onItemKeyDown.bind(this, item)
        item.actions.onBlur = this.onItemBlur.bind(this, item)
        item.actions.onDestroy = this.onItemDestroy.bind(this, item)
    }

    protected async handleClockUpdate() {
        this.clockScope.date = new Date()
    }

    protected onHeaderSyncInputChange(value: string) {
        this.headerScope.inputValue = value
    }

    protected onHeaderSyncInputKeyDown(event: KeyDownEvent) {
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
            this.onAddItem(trimVal)
        }
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
            itemScope.completed = checked
        }
    }

    @action()
    protected async onClearCompleted() {
        this.itemScopes.removeByCriteria(item => !item.completed)
    }

    @action()
    protected async onShowAll() {
        this.footerScope.showing = ShowingOptions.ALL
        this.updateHistory()
    }

    @action()
    protected async onShowActives() {
        this.footerScope.showing = ShowingOptions.ACTIVE
        this.updateHistory()
    }

    @action()
    protected async onShowCompleteds() {
        this.footerScope.showing = ShowingOptions.COMPLETED
        this.updateHistory()
    }

    @action()
    protected async onItemToggle(item: ItemScope) {
        item.completed = !item.completed
    }

    @action()
    protected async onItemEdit(item: ItemScope) {
        for (const otherItem of this.itemScopes) {
            if (otherItem !== item) {
                otherItem.editing = false
            }
        }

        item.editing = true
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
            this.itemScopes.removeByIndex(itemIdx)
        }
    }

    protected cancelItem(item: ItemScope) {
        item.editing = false
    }

    protected saveItem(item: ItemScope, val: string) {
        const trimVal = val ? val.trim() : ''
        if (trimVal) {
            item.title = trimVal
            item.editing = false
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
        let allItemsCompleted = false
        let toggleButtonVisible = false

        let totalNumOfCompletedTask = 0

        if (this.itemScopes.length > 0) {
            let itemCount = 0
            const updateOrAddItem = (itemScope: ItemScope) => {
                this.mainScope.items.set(itemCount++, itemScope)
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

            this.mainScope.items.length = itemCount

            allItemsCompleted = completeCount === this.mainScope.items.length
            toggleButtonVisible = this.mainScope.items.length !== 0
        } else {
            allItemsCompleted = false
            toggleButtonVisible = false

            this.mainScope.items.length = 0
        }

        this.headerScope.allItemsCompleted = allItemsCompleted
        this.headerScope.toggleButtonVisible = toggleButtonVisible

        if (this.mainScope.items.length > 0) {
            this.scope.main = this.mainScope
        } else {
            this.scope.main = undefined
        }

        if (this.itemScopes.length > 0) {
            const showClearButton = totalNumOfCompletedTask > 0
            this.footerScope.clearButtonVisible = showClearButton

            this.footerScope.count = this.mainScope.items.length
            if (this.footerScope.count > 1) {
                this.footerScope.activeTodoWord = 'items'
            } else {
                this.footerScope.activeTodoWord = 'item'
            }

            this.scope.footer = this.footerScope
        } else {
            this.scope.footer = undefined
        }
    }

}