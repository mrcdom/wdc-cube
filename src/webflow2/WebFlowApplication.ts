import Logger from '../utils/logger'
import { WebFlowStep } from './WebFlowStep'
import { WebFlowPlace } from './WebFlowPlace'
import { WebFlowPresenter } from './WebFlowPresenter'
import { WebFlowHistoryManager } from './WebFlowHistoryManager'
import type { WebFlowScope } from './WebFlowScope'

const LOG = Logger.get('WebFlowApplication')

const FN_NOOP = () => {
    // NOOP
}

class Comparator {

    public static naturalOrderForNumber(a: number, b: number): number {
        return a - b
    }

    public static reverseOrderForNumber(a: number, b: number): number {
        return b - a
    }

}

type PresenterMap = Map<number, WebFlowPresenter<WebFlowApplication, WebFlowScope>>

type NavicationCommitResponse = (
    presenterMap: PresenterMap,
    lastStep: WebFlowStep
) => void

export class NavigationContext<A extends WebFlowApplication> {

    private app: A

    private curPresenterMap: PresenterMap
    private newPresenterMap: PresenterMap
    private sourcePlace: WebFlowPlace
    private targetPlace: WebFlowPlace

    constructor(app: A, targetPlace: WebFlowPlace) {
        this.app = app
        this.curPresenterMap = new Map()
        this.newPresenterMap = new Map()
        this.sourcePlace = app.newPlace()
        this.targetPlace = targetPlace
    }

    public async step<P extends WebFlowPresenter<A, WebFlowScope>>
        (
            step: WebFlowStep,
            deepest: boolean,
            factory: new (app: A) => P
        ) {

        this.targetPlace.setStep(step)

        let result: boolean

        const presenter = this.curPresenterMap.get(step.id)
        if (presenter) {
            this.newPresenterMap.set(step.id, presenter)
            result = await presenter.applyParameters(this.targetPlace, false, deepest)
        } else {
            const presenter = new factory(this.app)
            this.newPresenterMap.set(step.id, presenter)
            result = await presenter.applyParameters(this.targetPlace, true, deepest)
        }

        if (deepest) {
            this.commit()
        }

        return result

    }

    public rollback(): void {
        try {
            const presenterIds = [] as number[]

            // Collect current presenters IDs
            for (const id of this.curPresenterMap.keys()) {
                presenterIds.push(id)
            }

            // Sort according to ID to preserve composition order
            presenterIds.sort(Comparator.naturalOrderForNumber)

            for (let i = 0, iLast = presenterIds.length - 1; i <= iLast; i++) {
                const presenterId = presenterIds[i]
                try {
                    this.newPresenterMap.delete(presenterId)

                    const presenter = this.curPresenterMap.get(presenterId)
                    if (presenter != null) {
                        presenter.applyParameters(this.sourcePlace, false, i == iLast)
                    } else {
                        LOG.warn(`Missing presenter for ID=${presenterId}`)
                    }
                } catch (caught) {
                    LOG.error('Restoring source state', caught)
                }
            }

            if (this.newPresenterMap.size > 0) {
                this.releasePresenters(this.newPresenterMap)
                this.newPresenterMap.clear()
            }
        } finally {
            this.app.updateHistory()
        }
    }

    public commit(): void {
        try {
            // Remove presenters that will be kept
            for (const presenterId of this.newPresenterMap.keys()) {
                this.curPresenterMap.delete(presenterId)
            }

            // Non participating paresenter on new state must be released
            if (this.curPresenterMap.size > 0) {
                this.releasePresenters(this.curPresenterMap)
            }
        } finally {
            this.app.__commit(this.newPresenterMap, this.targetPlace.getStep())
            this.app.updateHistory()
        }
    }

    private releasePresenters(presenterInstanceMap: PresenterMap): void {
        const presenterIds = [] as number[]

        for (const presenterId of presenterInstanceMap.keys()) {
            presenterIds.push(presenterId)
        }

        // release on reverse order (deepest level first)
        presenterIds.sort(Comparator.reverseOrderForNumber)

        for (const presenterId of presenterIds) {
            const presenter = presenterInstanceMap.get(presenterId)
            if (presenter != null) {
                try {
                    presenterInstanceMap.delete(presenterId)
                    presenter.release()
                } catch (caught) {
                    LOG.error('Releasing presenter', caught)
                }
            }
        }
    }

}

export class WebFlowApplication {

    protected presenterMap: Map<number, WebFlowPresenter<WebFlowApplication, WebFlowScope>>

    protected _lastStep: WebFlowStep

    protected _fragment?: string

    protected historyManager: WebFlowHistoryManager

    private historyUpdateDebounceHandler = 0

    public constructor(rootStep: WebFlowStep, historyManager: WebFlowHistoryManager) {
        this._lastStep = rootStep
        this.historyManager = historyManager
        this.presenterMap = new Map()
    }

    public release(): void {
        const presenterIds = [] as number[]

        // Collect current presenters IDs
        for (const id of this.presenterMap.keys()) {
            presenterIds.push(id)
        }

        // Release must be made in reverse order
        presenterIds.sort(Comparator.reverseOrderForNumber)

        // Release all presenters
        for (const presenterId of presenterIds) {
            const presenter = this.presenterMap.get(presenterId)
            if (presenter) {
                this.presenterMap.delete(presenterId)
                try {
                    presenter.release()
                } catch (caught) {
                    LOG.error(`Releasing presenter ${presenter.constructor.name}`, caught)
                }
            }
        }

        this.presenterMap.clear()
    }

    public get lastStep(): WebFlowStep {
        return this._lastStep
    }

    public get fragment(): string | undefined {
        return this._fragment
    }

    public publishParameters(place: WebFlowPlace): void {
        for (const presenter of this.presenterMap.values()) {
            presenter.publishParameters(place)
        }
    }

    public commitComputedState(): void {
        for (const presenter of this.presenterMap.values()) {
            try {
                presenter.commitComputedState()
            } catch (caught) {
                LOG.error(`Processing ${presenter.constructor.name}.commitComputedState()`, caught)
            }
        }
    }

    public newPlace(step?: WebFlowStep): WebFlowPlace {
        const place = new WebFlowPlace(step ?? this.lastStep)
        this.publishParameters(place)
        return place
    }

    public updateHistory(): void {
        if (this.historyUpdateDebounceHandler) {
            clearTimeout(this.historyUpdateDebounceHandler)
            this.historyUpdateDebounceHandler = 0
        }

        this.historyUpdateDebounceHandler = setTimeout(this.doUpdateHistory, 16, this)
    }

    protected doUpdateHistory() {
        const token = this.newPlace().toString()
        this.historyManager.update(token)
    }

    public __commit(presenterMap: PresenterMap, step: WebFlowStep) {
        this.presenterMap = presenterMap
        this._lastStep = step
    }

    public getPresenter<T extends WebFlowPresenter<WebFlowApplication, WebFlowScope>>(step: WebFlowStep) {
        return this.presenterMap.get(step.id) as T | undefined
    }

}