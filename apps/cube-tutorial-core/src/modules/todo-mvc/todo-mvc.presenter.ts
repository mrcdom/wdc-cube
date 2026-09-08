/*
 * Based on https://todomvc.com/examples/react
 */

import { Logger, CubePresenter, ScopeSlot, FlipIntent, ObservableArray, NOOP_VOID } from 'wdc-cube'
import { TutorialService } from '../../services/TutorialService'
import { MainPresenter } from '../main/main.presenter'
import { TodoMvcKeys } from './todo-mvc.key'
import {
    TodoMvcScope,
    HeaderScope,
    MainScope,
    ClockScope,
    FooterScope,
    ItemScope,
    ShowingOptions,
    type KeyDownEvent
} from './todo-mvc.scope'

const LOG = Logger.get('TodoMvcPresenter')

// @Inject
const tutorialService = TutorialService.INSTANCE

// :: Scopes

// :: Presentation

export class TodoMvcPresenter extends CubePresenter<MainPresenter, TodoMvcScope> {
    private parentSlot: ScopeSlot = NOOP_VOID

    private readonly headerScope = new HeaderScope()

    private readonly mainScope = new MainScope()

    private readonly clockScope = new ClockScope()

    private readonly footerScope = new FooterScope()

    private readonly itemScopes: ObservableArray<ItemScope>

    private userId = 0

    // ReturnType<typeof setInterval> rather than number or NodeJS.Timeout: this
    // package is consumed as source, so whoever compiles it decides which global
    // types are in scope — and those two spellings disagree between DOM and Node.
    private clockUpdateHandler?: ReturnType<typeof setInterval>

    // Not attached to any scope, but it still needs the guard because it is
    // triggered from within onHeaderSyncInputKeyDown
    private readonly addItem = this.action(this.onAddItem)

    public constructor(app: MainPresenter) {
        super(app, new TodoMvcScope())

        this.itemScopes = new ObservableArray<ItemScope>(this.mainScope)

        // Bind Events
        // onSyncInputChange/onSyncInputKeyDown are not actions: they only mirror
        // the field's state, without triggering an update or a history entry
        this.headerScope.actions.onSyncInputChange = this.onHeaderSyncInputChange.bind(this)
        this.headerScope.actions.onSyncInputKeyDown = this.onHeaderSyncInputKeyDown.bind(this)
        this.headerScope.actions.onToggleAll = this.action(this.onToggleAll)

        this.footerScope.actions.onClearCompleted = this.action(this.onClearCompleted)
        this.footerScope.actions.onShowAll = this.action(this.onShowAll)
        this.footerScope.actions.onShowActives = this.action(this.onShowActives)
        this.footerScope.actions.onShowCompleteds = this.action(this.onShowCompleteds)

        this.scope.actions.onToggleStress = this.action(this.onToggleStress)

        this.headerScope.update = this.update
        this.mainScope.update = this.update
        this.footerScope.update = this.update
        this.clockScope.update = this.update

        this.scope.header = this.headerScope

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

    public override async applyParameters(intent: FlipIntent, initialization: boolean): Promise<boolean> {
        const keys = new TodoMvcKeys(this.app, intent)

        if (initialization) {
            await this.initializeState(keys)
        } else {
            await this.synchronizeState(keys)
        }

        this.parentSlot(this.scope)

        return true
    }

    public override publishParameters(intent: FlipIntent): void {
        const keys = new TodoMvcKeys(this.app, intent)

        if (this.footerScope.showing !== ShowingOptions.ALL) {
            keys.showing = this.footerScope.showing
        }

        if (this.userId !== 0) {
            keys.userId = this.userId
        }
    }

    private async initializeState(keys: TodoMvcKeys) {
        this.parentSlot = keys.parentSlot
        await this.synchronizeState(keys, true)
        LOG.debug('Initialized')
    }

    private async synchronizeState(keys: TodoMvcKeys, force = false) {
        const uriUserId = keys.userId ?? this.userId
        const uriShowing = keys.showing ?? this.footerScope.showing

        this.footerScope.showing = uriShowing

        if (force || uriUserId !== this.userId) {
            this.userId = uriUserId
            this.scope.stressMode = this.userId < 0

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
            // What the row stands for, so a view reconciling the list matches on
            // the todo rather than on this particular object.
            todoScope.identity = todo.id
            todoScope.id = todo.id
            todoScope.title = todo.title
            todoScope.completed = todo.completed
            this.bindItemScopeActions(todoScope)
            this.itemScopes.push(todoScope)
        }
    }

    private bindItemScopeActions(item: ItemScope) {
        item.update = this.update
        item.actions.onToggle = this.action(this.onItemToggle.bind(this, item))
        item.actions.onEdit = this.action(this.onItemEdit.bind(this, item))
        item.actions.onKeyDown = this.action(this.onItemKeyDown.bind(this, item))
        item.actions.onBlur = this.action(this.onItemBlur.bind(this, item))
        item.actions.onDestroy = this.action(this.onItemDestroy.bind(this, item))
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
            this.addItem(trimVal)
        }
    }

    protected onAddItem(value: string) {
        const lastUid = this.itemScopes.reduce((accum, todo) => Math.max(todo.id, accum), 0)

        const todoScope = new ItemScope()
        todoScope.identity = lastUid + 1
        todoScope.id = lastUid + 1
        todoScope.title = value
        todoScope.completed = false
        this.bindItemScopeActions(todoScope)
        this.itemScopes.push(todoScope)
    }

    /**
     * Switches between the sample list and the 1000-item generator. It navigates
     * through an intent rather than mutating state directly, so the mode lands in
     * the URL and reloading the page keeps you where you were.
     */
    protected async onToggleStress() {
        const keys = new TodoMvcKeys(this.app)
        keys.userId = this.userId < 0 ? 0 : -1
        keys.showing = this.footerScope.showing
        await keys.flip()
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
            itemScope.completed = checked
        }
    }

    protected async onClearCompleted() {
        // removeByCriteria drops the items the predicate matches, so this has to
        // match the completed ones. The negation here removed the active items
        // instead, and had done so since the tutorial was first written.
        this.itemScopes.removeByCriteria((item) => item.completed)
    }

    protected async onShowAll() {
        this.footerScope.showing = ShowingOptions.ALL
    }

    protected async onShowActives() {
        this.footerScope.showing = ShowingOptions.ACTIVE
    }

    protected async onShowCompleteds() {
        this.footerScope.showing = ShowingOptions.COMPLETED
    }

    protected async onItemToggle(item: ItemScope) {
        item.completed = !item.completed
    }

    protected async onItemEdit(item: ItemScope) {
        for (const otherItem of this.itemScopes) {
            if (otherItem !== item) {
                otherItem.editing = false
            }
        }

        item.editing = true
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
        const itemIdx = this.itemScopes.findIndex((i) => i.id === item.id)
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
        let numCompletedTasks = 0
        let numPendingTasks = 0

        if (this.itemScopes.length > 0) {
            let numItems = 0

            for (const itemScope of this.itemScopes) {
                if (itemScope.completed) {
                    numCompletedTasks++
                } else {
                    numPendingTasks++
                }

                switch (this.footerScope.showing) {
                    case ShowingOptions.ACTIVE:
                        if (!itemScope.completed) {
                            this.mainScope.items.set(numItems++, itemScope)
                        }
                        break
                    case ShowingOptions.COMPLETED:
                        if (itemScope.completed) {
                            this.mainScope.items.set(numItems++, itemScope)
                        }
                        break
                    default:
                        this.mainScope.items.set(numItems++, itemScope)
                }
            }

            this.mainScope.items.length = numItems
        }

        if (numCompletedTasks > 0 || numPendingTasks > 0) {
            this.headerScope.allItemsCompleted = numPendingTasks === 0
            this.headerScope.toggleButtonVisible = true

            this.footerScope.count = numPendingTasks
            this.footerScope.activeTodoWord = numPendingTasks > 1 ? 'items' : 'item'
            this.footerScope.clearButtonVisible = numCompletedTasks > 0

            if (this.mainScope.clock || this.mainScope.items.length > 0) {
                this.scope.main = this.mainScope
            } else {
                this.scope.main = undefined
            }

            this.scope.footer = this.footerScope
        } else {
            this.headerScope.allItemsCompleted = false
            this.headerScope.toggleButtonVisible = false
            this.footerScope.count = 0
            this.footerScope.clearButtonVisible = false
            this.mainScope.items.length = 0
            this.scope.main = this.mainScope.clock ? this.mainScope : undefined
            this.scope.footer = undefined
        }
    }
}
