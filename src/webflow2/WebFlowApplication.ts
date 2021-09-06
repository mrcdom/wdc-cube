import Logger from '../utils/logger'
import { WebFlowStep } from './WebFlowStep'
import { WebFlowPlace } from './WebFlowPlace'
import { WebFlowPresenter } from './WebFlowPresenter'
import { WebFlowHistoryManager } from './WebFlowHistoryManager'
import type { WebFlowScope } from './WebFlowScope'
import { CastUtils } from './CastUtils'

const LOG = Logger.get('WebFlowApplication')

class Comparator {

    public static naturalOrderForNumber(a: number, b: number): number {
        return a - b
    }

    public static reverseOrderForNumber(a: number, b: number): number {
        return b - a
    }

}

type PresenterType = WebFlowPresenter<WebFlowApplication, WebFlowScope>
type PresenterMapType = Map<number, PresenterType>
type PresenterNode = {
    step: WebFlowStep
    instance: PresenterType
}

let CURRENT_NAVIGATION_CONTEXT: NavigationContext<WebFlowApplication> | undefined = undefined

export class NavigationContext<A extends WebFlowApplication> {

    private app: A

    private curPresenterMap: PresenterMapType
    private newPresenterMap: PresenterMapType
    private sourcePlace: WebFlowPlace
    private targetPlace: WebFlowPlace
    private overlappedLevel: number
    private path: PresenterNode[]

    public constructor(app: A, targetPlace?: WebFlowPlace) {
        this.app = app
        this.targetPlace = targetPlace || app.newPlace()

        if (CURRENT_NAVIGATION_CONTEXT) {
            this.sourcePlace = CURRENT_NAVIGATION_CONTEXT.sourcePlace
            this.newPresenterMap = CURRENT_NAVIGATION_CONTEXT.newPresenterMap
            this.curPresenterMap = CURRENT_NAVIGATION_CONTEXT.curPresenterMap
            this.overlappedLevel = CURRENT_NAVIGATION_CONTEXT.overlappedLevel + 1
            this.path = CURRENT_NAVIGATION_CONTEXT.path
            this.path.length = 0
        } else {
            this.overlappedLevel = 0
            this.sourcePlace = app.newPlace()
            this.path = []
            this.newPresenterMap = new Map()
            this.curPresenterMap = this.app.__exportPresenters()
        }

        CURRENT_NAVIGATION_CONTEXT = this
    }

    public async step<P extends WebFlowPresenter<A, WebFlowScope>>
        (
            step: WebFlowStep,
            deepest: boolean,
            factory: new (app: A) => P
        ) {
        if (this.overlappedLevel !== (CURRENT_NAVIGATION_CONTEXT?.overlappedLevel ?? 0)) {
            return
        }

        this.targetPlace.setStep(step)
        let result: boolean

        const presenter = this.curPresenterMap.get(step.id)
        if (presenter) {
            this.path.push({ step, instance: presenter })
            this.newPresenterMap.set(step.id, presenter)
            result = await presenter.applyParameters(this.targetPlace, false, deepest)
        } else {
            const presenter = new factory(this.app)
            this.newPresenterMap.set(step.id, presenter)
            this.path.push({ step, instance: presenter })
            result = await presenter.applyParameters(this.targetPlace, true, deepest)
        }

        return result
    }

    public rollback(): void {
        if (this.overlappedLevel === 0) {
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
                CURRENT_NAVIGATION_CONTEXT = undefined
                this.app.commitComputedFields()
                this.app.updateHistory()
            }
        }
    }

    public commit(): void {
        if (this.overlappedLevel === 0) {
            try {
                const validPresenterMap = new Map() as PresenterMapType
                // Only presenters of last valid path must be kept
                for (const node of this.path) {
                    const presenter = this.newPresenterMap.get(node.step.id)
                    if (presenter) {
                        validPresenterMap.set(node.step.id, presenter)
                    }
                }

                // Remove presenters that will be kept
                for (const presenterId of validPresenterMap.keys()) {
                    this.curPresenterMap.delete(presenterId)
                }

                // Remove presenters that will be kept
                for (const presenterId of this.newPresenterMap.keys()) {
                    this.newPresenterMap.delete(presenterId)
                }

                // Non participating paresenter on new state must be released
                if (this.curPresenterMap.size > 0) {
                    this.releasePresenters(this.curPresenterMap)
                }

                if (this.newPresenterMap.size > 0) {
                    this.releasePresenters(this.newPresenterMap)
                }
            } finally {
                CURRENT_NAVIGATION_CONTEXT = undefined
                this.app.__commit(this.path)
                this.app.commitComputedFields()
                this.app.updateHistory()
            }
        }
    }

    private releasePresenters(presenterInstanceMap: PresenterMapType): void {
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

    protected goMap: Map<string, (place?: WebFlowPlace) => Promise<void>>

    protected presenterMap: PresenterMapType

    protected path: PresenterNode[]

    protected _fragment?: string

    protected _historyManager: WebFlowHistoryManager

    public constructor() {
        this.path = []
        this._historyManager = WebFlowHistoryManager.NOOP
        this.presenterMap = new Map()
        this.goMap = new Map()
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

    public get historyManager() {
        return this._historyManager
    }

    public get lastStep(): WebFlowStep {
        if (this.path.length > 0) {
            const presenter = this.path[this.path.length - 1]
            return presenter.step
        } else {
            return WebFlowStep.UNKNOWN
        }
    }

    public get fragment(): string | undefined {
        return this._fragment
    }

    public publishParameters(place: WebFlowPlace): void {
        for (const presenter of this.presenterMap.values()) {
            presenter.publishParameters(place)
        }
    }

    public commitComputedFields(): void {
        for (const presenter of this.presenterMap.values()) {
            try {
                presenter.commitComputedFields()
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
        this.historyManager.update()
    }

    public __commit(path: PresenterNode[]) {
        this.presenterMap.clear()
        this.path = path
        for (const node of path) {
            this.presenterMap.set(node.step.id, node.instance)
        }
    }

    public __exportPresenters(): PresenterMapType {
        const result = new Map() as PresenterMapType
        for (const [id, presenter] of this.presenterMap) {
            result.set(id, presenter)
        }
        return result
    }

    public getPresenter(step: WebFlowStep) {
        return this.presenterMap.get(step.id)
    }

    public catalogGoParser(step: WebFlowStep, goAction: (place?: WebFlowPlace) => Promise<void>) {
        this.goMap.set(step.name, goAction)
    }

    public async go(placeStr: string) {
        const place = WebFlowPlace.parse(placeStr)
        const action = this.goMap.get(place.getStep().name)
        if (action) {
            await action(place)
        } else {
            throw new Error(`No place found under name=${place.getStep().name}`)
        }
    }

}